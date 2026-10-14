import { getDatabase } from "@netlify/database";
import type { Config } from "@netlify/functions";

const db = getDatabase();
const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export default async (req: Request) => {
  try {
    const expected = process.env.ABSENSI_ADMIN_KEY;
    if (!expected) return json({ error: "ABSENSI_ADMIN_KEY belum diatur pada Environment Variables Netlify." }, 503);
    if (req.headers.get("x-admin-key") !== expected) return json({ error: "Kunci admin salah atau belum diatur." }, 401);

    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/$/, "");
    const method = req.method.toUpperCase();

    if (path === "students" && method === "GET") {
      const rows = await db.sql`
        SELECT id, name, nis, class_name AS cls, descriptor
        FROM attendance_students ORDER BY name ASC
      `;
      return json({ students: rows });
    }

    if (path === "students" && method === "POST") {
      const body = await req.json() as {name?: string; nis?: string; cls?: string; descriptor?: number[]};
      const name = String(body.name ?? "").trim();
      const nis = String(body.nis ?? "").trim();
      const cls = String(body.cls ?? "").trim();
      const descriptor = body.descriptor;
      if (!name || !nis || !cls || !Array.isArray(descriptor) || descriptor.length !== 128 ||
          !descriptor.every(v => typeof v === "number" && Number.isFinite(v))) {
        return json({ error: "Data siswa atau descriptor wajah tidak valid." }, 400);
      }
      const existing = await db.sql`SELECT id FROM attendance_students WHERE lower(nis) = lower(${nis}) LIMIT 1`;
      if (existing.length) return json({ error: "NIS sudah terdaftar." }, 409);
      const inserted = await db.sql`
        INSERT INTO attendance_students (name, nis, class_name, descriptor)
        VALUES (${name}, ${nis}, ${cls}, ${JSON.stringify(descriptor)}::jsonb)
        RETURNING id, name, nis, class_name AS cls, descriptor
      `;
      return json({ student: inserted[0] }, 201);
    }

    if (path === "students" && method === "DELETE") {
      const body = await req.json() as {nis?: string};
      const nis = String(body.nis ?? "").trim();
      if (!nis) return json({ error: "NIS wajib diisi." }, 400);
      await db.sql`DELETE FROM attendance_students WHERE nis = ${nis}`;
      return json({ ok: true });
    }

    if (path === "attendance" && method === "GET") {
      const rows = await db.sql`
        SELECT id, attendance_date::text AS date, to_char(attendance_time, 'HH24:MI:SS') AS time,
               name, nis, class_name AS cls, status, distance
        FROM attendance_records ORDER BY attendance_date DESC, attendance_time DESC LIMIT 1000
      `;
      return json({ attendance: rows });
    }

    if (path === "attendance" && method === "POST") {
      const body = await req.json() as {nis?: string; status?: string; distance?: number};
      const nis = String(body.nis ?? "").trim();
      const status = String(body.status ?? "");
      if (!nis || !["Masuk", "Pulang"].includes(status)) return json({ error: "NIS atau status tidak valid." }, 400);
      const s = await db.sql`SELECT name, nis, class_name FROM attendance_students WHERE nis = ${nis} LIMIT 1`;
      if (!s.length) return json({ error: "Siswa tidak ditemukan." }, 404);
      const duplicate = await db.sql`
        SELECT id FROM attendance_records
        WHERE nis = ${nis} AND attendance_date = CURRENT_DATE AND status = ${status} LIMIT 1
      `;
      if (duplicate.length) return json({ error: "Siswa sudah tercatat untuk status ini hari ini." }, 409);
      const distance = typeof body.distance === "number" && Number.isFinite(body.distance) ? body.distance : null;
      const rows = await db.sql`
        INSERT INTO attendance_records (name, nis, class_name, status, distance)
        VALUES (${s[0].name}, ${s[0].nis}, ${s[0].class_name}, ${status}, ${distance})
        RETURNING id, attendance_date::text AS date, to_char(attendance_time, 'HH24:MI:SS') AS time,
                  name, nis, class_name AS cls, status, distance
      `;
      return json({ record: rows[0] }, 201);
    }

    return json({ error: "Endpoint tidak ditemukan." }, 404);
  } catch (error) {
    console.error("Absensi API error", error);
    return json({ error: "Terjadi kesalahan server/database. Periksa Function logs dan status migrasi." }, 500);
  }
};

export const config: Config = { path: "/api/*" };