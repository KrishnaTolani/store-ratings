import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0].c) > 0;
}

async function migrate(conn) {
  if (!(await columnExists(conn, "ratings", "comment"))) {
    await conn.query("ALTER TABLE ratings ADD COLUMN comment VARCHAR(400) NULL");
  }
  if (!(await columnExists(conn, "ratings", "emoji"))) {
    await conn.query("ALTER TABLE ratings ADD COLUMN emoji VARCHAR(16) NULL");
  }
}

async function seedPhotos(conn) {
  const [count] = await conn.query("SELECT COUNT(*) AS c FROM store_photos");
  if (Number(count[0].c) > 0) return;

  const [stores] = await conn.query("SELECT id, email FROM stores");
  const photos = {
    "hello@northsidegoods.com": [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
      "https://images.unsplash.com/photo-1472851298512-d245bb5f5557?w=1200&q=80",
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=1200&q=80",
    ],
    "contact@fontainemarket.com": [
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80",
      "https://images.unsplash.com/photo-1488459716781-31cf13d2dfe1?w=1200&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=80",
    ],
    "support@evergreenhardware.com": [
      "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80",
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&q=80",
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80",
    ],
  };

  for (const store of stores) {
    const urls = photos[store.email] || photos["hello@northsidegoods.com"];
    for (let i = 0; i < urls.length; i++) {
      await conn.execute(
        "INSERT INTO store_photos (store_id, url, sort_order) VALUES (?, ?, ?)",
        [store.id, urls[i], i],
      );
    }
  }
}

async function seedReviewText(conn) {
  await conn.query(`
    UPDATE ratings SET comment = 'Loved the selection and the staff were so helpful.', emoji = '😍'
    WHERE comment IS NULL AND value = 5 LIMIT 20
  `);
  await conn.query(`
    UPDATE ratings SET comment = 'Solid visit — would come back again.', emoji = '👍'
    WHERE comment IS NULL AND value = 4 LIMIT 20
  `);
  await conn.query(`
    UPDATE ratings SET comment = 'It was okay, a bit crowded at peak hours.', emoji = '😊'
    WHERE comment IS NULL AND value = 3 LIMIT 20
  `);
  await conn.query(`
    UPDATE ratings SET comment = 'Needed more stock on the shelves.', emoji = '😮'
    WHERE comment IS NULL AND value = 2 LIMIT 20
  `);
  await conn.query(`
    UPDATE ratings SET comment = 'Not what I expected this time.', emoji = '😢'
    WHERE comment IS NULL LIMIT 20
  `);
}

async function main() {
  const config = {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    multipleStatements: true,
  };

  const conn = await mysql.createConnection(config);
  const schemaPath = path.join(__dirname, "../../sql/schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  await conn.query(schemaSql);
  await conn.changeUser({ database: process.env.MYSQL_DATABASE || "store_ratings" });
  await migrate(conn);

  const [existing] = await conn.query("SELECT COUNT(*) AS c FROM users");
  if (Number(existing[0].c) === 0) {
    const hash = async (password) => bcrypt.hash(password, 10);

    const users = [
      ["Alexandra Systems Administrator", "admin@storeratings.app", await hash("Admin@1234"), "18 Quantum Avenue, Cupertino, CA", "ADMIN"],
      ["Jonathan Michael Richardson", "jonathan@example.com", await hash("User@1234"), "44 Maple Street, Brooklyn, NY", "USER"],
      ["Priyanka Venkatanarayanan", "priyanka@example.com", await hash("User@1234"), "9 Rosewood Lane, Austin, TX", "USER"],
      ["Gregory Alan Whitmore Owner", "gregory@northsidegoods.com", await hash("Owner@1234"), "120 Harbour Road, Seattle, WA", "OWNER"],
      ["Isabella Marie Fontaine Owner", "isabella@fontainemarket.com", await hash("Owner@1234"), "77 Vine Street, Portland, OR", "OWNER"],
    ];

    for (const u of users) {
      await conn.execute(
        "INSERT INTO users (name, email, password_hash, address, role) VALUES (?, ?, ?, ?, ?)",
        u,
      );
    }

    const [ownerRows] = await conn.query("SELECT id, email FROM users WHERE role = 'OWNER' ORDER BY id");
    const ownerByEmail = Object.fromEntries(ownerRows.map((r) => [r.email, r.id]));

    const stores = [
      ["Northside Goods & Provisions Co.", "hello@northsidegoods.com", "120 Harbour Road, Seattle, WA", ownerByEmail["gregory@northsidegoods.com"]],
      ["Fontaine Market and Fine Foods", "contact@fontainemarket.com", "77 Vine Street, Portland, OR", ownerByEmail["isabella@fontainemarket.com"]],
      ["Evergreen Hardware Supply Depot", "support@evergreenhardware.com", "301 Cedar Boulevard, Denver, CO", null],
    ];

    for (const s of stores) {
      await conn.execute("INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)", s);
    }

    const [userRows] = await conn.query("SELECT id, email FROM users WHERE role = 'USER' ORDER BY id");
    const [storeRows] = await conn.query("SELECT id, email FROM stores ORDER BY id");
    const userByEmail = Object.fromEntries(userRows.map((r) => [r.email, r.id]));
    const storeByEmail = Object.fromEntries(storeRows.map((r) => [r.email, r.id]));

    const ratings = [
      [userByEmail["jonathan@example.com"], storeByEmail["hello@northsidegoods.com"], 5, "Best neighborhood shop I have been to.", "😍"],
      [userByEmail["priyanka@example.com"], storeByEmail["hello@northsidegoods.com"], 4, "Great produce and friendly checkout.", "👍"],
      [userByEmail["jonathan@example.com"], storeByEmail["contact@fontainemarket.com"], 3, "Nice food, a little pricey.", "😊"],
      [userByEmail["priyanka@example.com"], storeByEmail["contact@fontainemarket.com"], 5, "The bakery counter is incredible.", "🔥"],
      [userByEmail["priyanka@example.com"], storeByEmail["support@evergreenhardware.com"], 2, "Could not find the tool I needed.", "😮"],
    ];

    for (const r of ratings) {
      await conn.execute(
        "INSERT INTO ratings (user_id, store_id, value, comment, emoji) VALUES (?, ?, ?, ?, ?)",
        r,
      );
    }

    console.log("Seed data inserted.");
  } else {
    console.log("Users already exist — skipping user/store seed.");
    await seedReviewText(conn);
  }

  await seedPhotos(conn);
  console.log("Schema, photos, and reviews are ready.");
  await conn.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
