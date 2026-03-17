/**
 * fix-demo-data.mjs
 * 1. 壊れた写真URLを有効なUnsplash画像に修正
 * 2. 全ホストに今後3ヶ月分の空き日程スロットを生成
 */
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ────────────────────────────────────────────────
// 1. 有効な料理・家庭料理系Unsplash画像プール
// ────────────────────────────────────────────────
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',  // 野菜ボウル
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80', // 和食プレート
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',  // 料理教室
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',  // 日本料理
  'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80', // 寿司
  'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80', // 麺料理
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80', // たこ焼き
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80', // 家庭料理
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80', // 農家料理
  'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=80', // 北海道料理
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', // 精進料理
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80', // 野菜料理
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', // 料理全般
  'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80', // 鍋料理
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3df1?w=800&q=80', // 和食
  'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800&q=80', // ラーメン
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80', // 農家
  'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&q=80',  // 家庭料理
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80', // 料理素材
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80', // パスタ
];

const HOST_IMAGES = [
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', // 女性
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', // 男性
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',  // 女性2
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', // 男性2
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', // 女性3
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', // 男性3
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80', // 女性4
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',  // 男性4
];

// ────────────────────────────────────────────────
// 2. 壊れた写真URLを持つ体験を修正
// ────────────────────────────────────────────────
console.log('📸 体験の写真URLを修正中...');
const [experiences] = await conn.query('SELECT id, imageUrls FROM experiences');
let fixedExpCount = 0;

for (const exp of experiences) {
  let urls;
  try {
    urls = JSON.parse(exp.imageUrls || '[]');
  } catch {
    urls = [];
  }

  // 壊れたURLを検出（photo-155xxxxxxx のような連番パターン）
  const hasBroken = urls.some(u =>
    u.includes('photo-155') || u.includes('photo-156') || u.includes('photo-157') ||
    u.includes('photo-158') || u.includes('photo-159') || u.includes('photo-160') ||
    !u.startsWith('http')
  );

  if (hasBroken || urls.length === 0) {
    const idx = (exp.id % FOOD_IMAGES.length);
    const idx2 = ((exp.id + 3) % FOOD_IMAGES.length);
    const newUrls = JSON.stringify([FOOD_IMAGES[idx], FOOD_IMAGES[idx2]]);
    await conn.query('UPDATE experiences SET imageUrls = ? WHERE id = ?', [newUrls, exp.id]);
    fixedExpCount++;
  }
}
console.log(`  ✅ ${fixedExpCount}件の体験写真URLを修正しました`);

// ────────────────────────────────────────────────
// 3. プロフィール画像がnullのホストを修正
// ────────────────────────────────────────────────
console.log('👤 ホストのプロフィール画像を修正中...');
const [hostsWithNoImage] = await conn.query(
  'SELECT id FROM hosts WHERE profileImageUrl IS NULL OR profileImageUrl = ""'
);
for (const host of hostsWithNoImage) {
  const img = HOST_IMAGES[host.id % HOST_IMAGES.length];
  await conn.query('UPDATE hosts SET profileImageUrl = ? WHERE id = ?', [img, host.id]);
}
console.log(`  ✅ ${hostsWithNoImage.length}件のホストプロフィール画像を設定しました`);

// ────────────────────────────────────────────────
// 4. 全ホストに今後3ヶ月分のスロットを生成
// ────────────────────────────────────────────────
console.log('📅 空き日程スロットを生成中...');
const [hosts] = await conn.query('SELECT id FROM hosts WHERE approvalStatus = "approved" AND isActive = 1');
console.log(`  対象ホスト: ${hosts.length}件`);

// 既存の将来スロットを削除（重複防止）
await conn.query('DELETE FROM hostAvailability WHERE date > CURDATE() AND bookingId IS NULL');

const today = new Date();
today.setHours(0, 0, 0, 0);

// バルクINSERT用のデータを一括生成
const bulkValues = [];
for (const host of hosts) {
  for (let dayOffset = 3; dayOffset <= 90; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 3 && dow !== 6) continue;
    const dateStr = date.toISOString().split('T')[0];
    if (dow === 0 || dow === 6) {
      bulkValues.push([host.id, dateStr, '10:00', '14:00', 6]);
      bulkValues.push([host.id, dateStr, '14:00', '18:00', 6]);
    } else {
      bulkValues.push([host.id, dateStr, '10:00', '14:00', 6]);
    }
  }
}

// 500件ずつバッチでINSERT
const BATCH = 500;
let totalSlots = 0;
for (let i = 0; i < bulkValues.length; i += BATCH) {
  const batch = bulkValues.slice(i, i + BATCH);
  await conn.query(
    `INSERT INTO hostAvailability (hostId, date, startTime, endTime, maxGuests, status, createdAt, updatedAt)
     VALUES ?`,
    [batch.map(v => [...v, 'available', new Date(), new Date()])]
  );
  totalSlots += batch.length;
  process.stdout.write(`\r  生成中: ${totalSlots}/${bulkValues.length}件`);
}
console.log(`\n  ✅ ${totalSlots}件の空き日程スロットを生成しました`);

// ────────────────────────────────────────────────
// 5. 確認
// ────────────────────────────────────────────────
const [check] = await conn.query(
  'SELECT COUNT(*) as cnt, MIN(date) as min_date, MAX(date) as max_date FROM hostAvailability WHERE date > CURDATE()'
);
console.log('📊 生成後の確認:', check[0]);

await conn.end();
console.log('\n🎉 デモデータ修正完了！');
