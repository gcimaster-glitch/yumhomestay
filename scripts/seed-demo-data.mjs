/**
 * デモアカウント フルスペックデータ作成スクリプト
 * 実行: node scripts/seed-demo-data.mjs
 *
 * 対象デモアカウント:
 *   - demo_host_001 (userId=750001): ホストファミリー「山田家」
 *   - demo_cooking_001 (userId=750002): 料理教室「京の味 田中料理教室」
 *   - demo_agent_001 (userId=750003): 旅行代理店「ジャパン・エクスペリエンス・トラベル」
 */

import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── ユーティリティ ────────────────────────────────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const daysLater = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
const dateStr = (d) => d.toISOString().slice(0, 10);

// ─── Step 1: デモユーザーのuserTypeを更新 ─────────────────────────────────────
console.log('Step 1: Updating demo user types...');
await conn.execute("UPDATE users SET userType='host' WHERE openId='demo_host_001'");
await conn.execute("UPDATE users SET userType='host' WHERE openId='demo_cooking_001'");
await conn.execute("UPDATE users SET userType='agent' WHERE openId='demo_agent_001'");

// ─── Step 2: ホストデモアカウント (userId=750001) ─────────────────────────────
console.log('Step 2: Creating demo host...');

// 既存のhostsレコードを削除（冪等性）
await conn.execute("DELETE FROM hosts WHERE userId=750001");

// hostsレコード作成
const [hostResult] = await conn.execute(`
  INSERT INTO hosts (
    userId, hostType, kycStatus, approvalStatus, isActive,
    bio, bioJa, bioEn,
    nearestStation, prefecture, city,
    languages, profileImageUrl,
    familyMemberCount, canCookTogether, hasSpecialCertification,
    certificationDetails, hasInsurance, registrationFeePaid, trainingCompleted,
    certificationIssuedAt, interviewCompletedAt,
    minSessionHours, maxSessionHours,
    dietaryAccommodations,
    createdAt, updatedAt
  ) VALUES (
    750001, 'individual', 'verified', 'approved', 1,
    '東京都世田谷区在住の山田家です。夫婦と子供2人の4人家族で、毎週末ゲストをお迎えしています。日本の家庭料理を一緒に作りながら、本物の日本の家族の温かさを体験していただけます。',
    '東京都世田谷区在住の山田家です。夫婦と子供2人の4人家族で、毎週末ゲストをお迎えしています。日本の家庭料理を一緒に作りながら、本物の日本の家族の温かさを体験していただけます。',
    'We are the Yamada family in Setagaya, Tokyo. A family of four (parents and two children), we welcome guests every weekend. You can experience the warmth of a real Japanese family while cooking traditional home-cooked meals together.',
    '三軒茶屋駅', '東京都', '世田谷区',
    '["ja","en"]',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400',
    4, 1, 1,
    'YumHost認定ホスト（2024年4月取得）・日本文化体験指導士',
    1, 1, 1,
    '2024-04-15 10:00:00', '2024-03-20 14:00:00',
    3, 5,
    '["vegetarian","gluten_free"]',
    '2024-01-10 09:00:00', NOW()
  )
`);
const demoHostId = hostResult.insertId;
console.log(`  Created host id=${demoHostId}`);

// ─── Step 3: ホスト体験3件 ────────────────────────────────────────────────────
console.log('Step 3: Creating demo host experiences...');
await conn.execute("DELETE FROM experiences WHERE hostId=?", [demoHostId]);

const [exp1] = await conn.execute(`
  INSERT INTO experiences (
    hostId, titleJa, titleEn, descriptionJa, descriptionEn,
    priceJpy, durationMinutes, maxGuests, minGuests,
    cuisineType, dietaryOptions, experienceType,
    cancellationPolicy, approvalStatus, isActive,
    imageUrls, createdAt, updatedAt
  ) VALUES (
    ?, '東京家庭料理体験 〜世田谷の山田家と作る和食〜',
    'Tokyo Home Cooking with the Yamada Family in Setagaya',
    '三軒茶屋駅から徒歩5分の一軒家で、山田家と一緒に本格的な和食を作りましょう。味噌汁・炊き込みご飯・煮物など、日本のお母さんの味を体験できます。食後は家族との団らんタイムもあります。',
    'Join the Yamada family in their home near Sangenjaya Station to cook authentic Japanese cuisine together. Make miso soup, takikomi gohan, and nimono — the flavors of a Japanese mother''s kitchen. After the meal, enjoy family conversation time.',
    55000, 240, 6, 2,
    'japanese', '["vegetarian","gluten_free"]', 'cooking',
    'moderate', 'approved', 1,
    '["https://images.unsplash.com/photo-1547592180-85f173990554?w=800","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"]',
    '2024-02-01 10:00:00', NOW()
  )
`, [demoHostId]);
const demoExpId1 = exp1.insertId;

const [exp2] = await conn.execute(`
  INSERT INTO experiences (
    hostId, titleJa, titleEn, descriptionJa, descriptionEn,
    priceJpy, durationMinutes, maxGuests, minGuests,
    cuisineType, dietaryOptions, experienceType,
    cancellationPolicy, approvalStatus, isActive,
    imageUrls, createdAt, updatedAt
  ) VALUES (
    ?, '世田谷おせち料理体験 〜お正月の伝統を学ぶ〜',
    'Osechi New Year Cooking Experience in Setagaya',
    'お正月に向けたおせち料理を一緒に作る特別体験です。黒豆・伊達巻・なますなど、縁起物の料理の意味と作り方を学べます。',
    'A special experience making traditional Osechi New Year dishes together. Learn the meaning and preparation of lucky foods like kuromame, datemaki, and namasu.',
    55000, 300, 4, 2,
    'japanese', '["vegetarian"]', 'both',
    'moderate', 'approved', 1,
    '["https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800"]',
    '2024-03-01 10:00:00', NOW()
  )
`, [demoHostId]);
const demoExpId2 = exp2.insertId;

const [exp3] = await conn.execute(`
  INSERT INTO experiences (
    hostId, titleJa, titleEn, descriptionJa, descriptionEn,
    priceJpy, durationMinutes, maxGuests, minGuests,
    cuisineType, dietaryOptions, experienceType,
    cancellationPolicy, approvalStatus, isActive,
    imageUrls, createdAt, updatedAt
  ) VALUES (
    ?, '子供と一緒に！東京家庭料理ファミリー体験',
    'Family Home Cooking Experience with Kids in Tokyo',
    'お子様連れのご家族に特化した体験です。子供でも楽しめる簡単な和食（おにぎり・卵焼き・お味噌汁）を一緒に作ります。山田家の子供たちとも交流できます。',
    'A family-focused experience for guests with children. Make simple Japanese dishes (onigiri, tamagoyaki, miso soup) that kids can enjoy too. Your children can also interact with the Yamada family kids.',
    55000, 240, 8, 2,
    'japanese', '["vegetarian","gluten_free"]', 'both',
    'flexible', 'approved', 1,
    '["https://images.unsplash.com/photo-1516684732162-798a0062be99?w=800"]',
    '2024-04-01 10:00:00', NOW()
  )
`, [demoHostId]);
const demoExpId3 = exp3.insertId;

console.log(`  Created experiences: ${demoExpId1}, ${demoExpId2}, ${demoExpId3}`);

// ─── Step 4: 空き日程（今日から30日分） ──────────────────────────────────────
console.log('Step 4: Creating host availability...');
await conn.execute("DELETE FROM hostAvailability WHERE hostId=?", [demoHostId]);

const availabilitySlots = [];
for (let i = 1; i <= 30; i++) {
  const d = daysLater(i);
  const dow = d.getDay(); // 0=Sun, 6=Sat
  // 土日のみ空き（週末ホスト）
  if (dow === 0 || dow === 6) {
    availabilitySlots.push([demoHostId, null, dateStr(d), '10:00', '15:00', 6, 'available', null, null]);
    availabilitySlots.push([demoHostId, null, dateStr(d), '16:00', '20:00', 4, 'available', null, null]);
  }
}
for (const slot of availabilitySlots) {
  await conn.execute(`
    INSERT INTO hostAvailability (hostId, cookingSchoolId, date, startTime, endTime, maxGuests, status, bookingId, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, slot);
}
console.log(`  Created ${availabilitySlots.length} availability slots`);

// ─── Step 5: ゲストユーザー（デモ用）を確認・作成 ─────────────────────────────
console.log('Step 5: Creating demo guest users...');
const guestData = [
  { openId: 'demo_guest_us_001', name: 'Sarah Johnson', email: 'sarah.j@example.com', lang: 'en' },
  { openId: 'demo_guest_cn_001', name: '李 明', email: 'li.ming@example.com', lang: 'zh' },
  { openId: 'demo_guest_kr_001', name: '김 지수', email: 'kim.jisu@example.com', lang: 'ko' },
  { openId: 'demo_guest_au_001', name: 'Emily Chen', email: 'emily.c@example.com', lang: 'en' },
  { openId: 'demo_guest_fr_001', name: 'Marie Dupont', email: 'marie.d@example.com', lang: 'en' },
];

const guestIds = [];
for (const g of guestData) {
  await conn.execute(`
    INSERT INTO users (openId, name, email, loginMethod, userType, preferredLanguage, createdAt, updatedAt, lastSignedIn)
    VALUES (?, ?, ?, 'demo', 'guest', ?, NOW(), NOW(), NOW())
    ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email)
  `, [g.openId, g.name, g.email, g.lang]);
  const [[u]] = await conn.execute("SELECT id FROM users WHERE openId=?", [g.openId]);
  guestIds.push(u.id);
}
console.log(`  Guest IDs: ${guestIds.join(', ')}`);

// ─── Step 6: 予約10件（completed×5, confirmed×3, pending×2） ─────────────────
console.log('Step 6: Creating demo bookings...');
await conn.execute("DELETE FROM bookings WHERE hostId=?", [demoHostId]);

const bookingData = [
  // completed（今月：3月）
  { guestIdx: 3, expId: demoExpId1, daysOffset: -5, adults: 4, children: 0, infants: 0, status: 'completed', currency: 'JPY', agentFee: 0 },
  { guestIdx: 4, expId: demoExpId3, daysOffset: -3, adults: 2, children: 2, infants: 1, status: 'completed', currency: 'JPY', agentFee: 8800 },
  // completed（先月：2月）→ 36日前・42日前は2月に入る
  { guestIdx: 0, expId: demoExpId1, daysOffset: -36, adults: 2, children: 0, infants: 0, status: 'completed', currency: 'JPY', agentFee: 0 },
  { guestIdx: 1, expId: demoExpId1, daysOffset: -42, adults: 3, children: 0, infants: 0, status: 'completed', currency: 'JPY', agentFee: 0 },
  // completed（その他過去）
  { guestIdx: 2, expId: demoExpId2, daysOffset: -65, adults: 2, children: 1, infants: 0, status: 'completed', currency: 'JPY', agentFee: 8800 },
  // confirmed（今後）
  { guestIdx: 0, expId: demoExpId1, daysOffset: 7, adults: 2, children: 0, infants: 0, status: 'confirmed', currency: 'JPY', agentFee: 0 },
  { guestIdx: 1, expId: demoExpId3, daysOffset: 14, adults: 2, children: 1, infants: 0, status: 'confirmed', currency: 'JPY', agentFee: 8800 },
  { guestIdx: 2, expId: demoExpId1, daysOffset: 21, adults: 3, children: 0, infants: 0, status: 'confirmed', currency: 'JPY', agentFee: 0 },
  // pending
  { guestIdx: 3, expId: demoExpId2, daysOffset: 28, adults: 2, children: 0, infants: 0, status: 'pending', currency: 'JPY', agentFee: 0 },
  { guestIdx: 4, expId: demoExpId1, daysOffset: 35, adults: 4, children: 2, infants: 0, status: 'pending', currency: 'JPY', agentFee: 8800 },
];

const bookingIds = [];
for (const b of bookingData) {
  const guestId = guestIds[b.guestIdx];
  const startTime = b.daysOffset < 0 ? daysAgo(-b.daysOffset) : daysLater(b.daysOffset);
  startTime.setHours(10, 0, 0, 0);
  const endTime = new Date(startTime);
  endTime.setHours(14, 0, 0, 0);

  // 料金計算（YHS仕様）
  const BASE = 55000;
  const EXTRA_ADULT = 22000;
  const EXTRA_CHILD = 11000;
  const EXTRA_INFANT = 5500;
  const extraAdult = Math.max(0, b.adults - 2) * EXTRA_ADULT;
  const extraChild = b.children * EXTRA_CHILD;
  const extraInfant = b.infants * EXTRA_INFANT;
  const amountJpy = BASE + extraAdult + extraChild + extraInfant;
  const cardFee = Math.round(amountJpy * 0.05);
  const hostPayout = 25000; // ホスト報酬（食材費込み）
  const serviceFee = amountJpy - hostPayout;

  const confirmedAt = b.status !== 'pending' ? startTime : null;
  const completedAt = b.status === 'completed' ? endTime : null;

  const [bkResult] = await conn.execute(`
    INSERT INTO bookings (
      guestId, hostId, experienceId, agentId,
      startTime, endTime,
      adultsCount, childrenCount, infantsCount,
      basePriceJpy, extraAdultPriceJpy, extraChildPriceJpy, extraInfantPriceJpy,
      amountTotal, currency, exchangeRateToJpy, amountJpy,
      serviceFeeJpy, hostPayoutJpy, agentFeeJpy, cardFeeJpy, affiliateFeeJpy,
      platformProfitJpy,
      pickupStation,
      status, confirmedAt, completedAt,
      videoCallRequired, videoCallCompletedAt,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, NULL,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, 'JPY', 1.000000, ?,
      ?, ?, ?, ?, 0,
      ?,
      '三軒茶屋駅',
      ?, ?, ?,
      1, ?,
      NOW(), NOW()
    )
  `, [
    guestId, demoHostId, b.expId,
    startTime, endTime,
    b.adults, b.children, b.infants,
    BASE, extraAdult, extraChild, extraInfant,
    amountJpy, amountJpy,
    serviceFee, hostPayout, b.agentFee, cardFee,
    amountJpy - hostPayout - b.agentFee - cardFee,
    b.status, confirmedAt, completedAt,
    b.status === 'completed' ? endTime : null,
  ]);
  bookingIds.push(bkResult.insertId);
}
console.log(`  Created ${bookingIds.length} bookings: ${bookingIds.join(', ')}`);

// ─── Step 7: レビュー8件（completedの予約に対して） ───────────────────────────
console.log('Step 7: Creating demo reviews...');
await conn.execute("DELETE FROM experienceReviews WHERE authorId IN (?,?,?,?,?)", guestIds);

const reviewTexts = [
  { en: 'An absolutely wonderful experience! The Yamada family was so warm and welcoming. We made delicious miso soup and tamagoyaki together. Highly recommend!', ja: '素晴らしい体験でした！山田家の皆さんがとても温かく迎えてくださいました。一緒に美味しい味噌汁と卵焼きを作りました。強くお勧めします！', rating: 5, food: 5, host: 5 },
  { en: 'The cooking experience was fantastic. I learned so much about Japanese home cooking. The family was incredibly kind and patient with my limited Japanese.', ja: '料理体験は素晴らしかったです。日本の家庭料理についてとても多くを学びました。家族の方々は私の限られた日本語にとても親切で忍耐強く接してくださいました。', rating: 5, food: 5, host: 5 },
  { en: 'Great experience overall. The food was delicious and the family was very friendly. The station pickup was very convenient.', ja: '全体的に素晴らしい体験でした。料理は美味しく、家族の方々はとても親切でした。駅での送迎がとても便利でした。', rating: 4, food: 5, host: 4 },
  { en: 'We had a wonderful time cooking with the Yamada family. My kids loved playing with their children. Will definitely come back!', ja: '山田家と一緒に料理をして素晴らしい時間を過ごしました。子供たちが山田家のお子さんたちと遊ぶのをとても楽しんでいました。また絶対に来ます！', rating: 5, food: 4, host: 5 },
  { en: 'Authentic Japanese home cooking experience. The family shared stories about their culture and traditions while we cooked. Very memorable.', ja: '本物の日本の家庭料理体験。料理をしながら、家族の方々が文化と伝統についての話を共有してくださいました。とても思い出深い体験でした。', rating: 5, food: 5, host: 5 },
];

for (let i = 0; i < 5; i++) {
  const rt = reviewTexts[i];
  await conn.execute(`
    INSERT INTO experienceReviews (
      experienceId, cookingSchoolId, authorId, authorName,
      ratingOverall, ratingFood, ratingHost,
      titleEn, commentEn, commentJa,
      isPublished, isFlagged,
      createdAt, updatedAt
    ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, NOW())
  `, [
    demoExpId1, guestIds[i],
    ['Sarah Johnson', '李 明', 'Emily Chen', 'Marie Dupont', 'Kim Jisu'][i],
    rt.rating, rt.food, rt.host,
    'Great experience!', rt.en, rt.ja,
    daysAgo(60 - i * 10),
  ]);
}
// ホスト返信（最初の2件）
const [[rev1]] = await conn.execute("SELECT id FROM experienceReviews WHERE authorId=? AND experienceId=?", [guestIds[0], demoExpId1]);
const [[rev2]] = await conn.execute("SELECT id FROM experienceReviews WHERE authorId=? AND experienceId=?", [guestIds[1], demoExpId1]);
if (rev1) await conn.execute("UPDATE experienceReviews SET replyByHost='ありがとうございます！またぜひいらしてください。Thank you so much! Please come visit us again!', repliedAt=NOW() WHERE id=?", [rev1.id]);
if (rev2) await conn.execute("UPDATE experienceReviews SET replyByHost='嬉しいお言葉ありがとうございます。またお待ちしています！Thank you for the kind words. We look forward to seeing you again!', repliedAt=NOW() WHERE id=?", [rev2.id]);

console.log('  Created 5 reviews with 2 host replies');

// ─── Step 8: 料理教室デモアカウント (userId=750002) ───────────────────────────
console.log('Step 8: Creating demo cooking school...');
await conn.execute("DELETE FROM cookingSchools WHERE userId=750002");

const [csResult] = await conn.execute(`
  INSERT INTO cookingSchools (
    userId, nameJa, nameEn, descriptionJa, descriptionEn,
    websiteUrl, phoneNumber, contactEmail,
    prefecture, city, nearestStation,
    maxCapacity, hasKitchenEquipment, hasWheelchairAccess, hasHalalKitchen,
    languages, certifications,
    cuisineSpecialty, maxStudents, pricePerPersonJpy,
    averageRating, profileImageUrl, galleryImageUrls, imageUrls,
    approvalStatus, isActive,
    createdAt, updatedAt
  ) VALUES (
    750002,
    '京の味 田中料理教室',
    'Kyo no Aji - Tanaka Cooking School',
    '京都・祇園に位置する本格的な日本料理教室です。30年以上の歴史を持ち、外国人観光客に日本の伝統料理を教えることを専門としています。英語・中国語・韓国語対応。',
    'An authentic Japanese cooking school located in Gion, Kyoto. With over 30 years of history, we specialize in teaching traditional Japanese cuisine to international visitors. Available in English, Chinese, and Korean.',
    'https://kyonaji-cooking.example.com',
    '075-123-4567',
    'info@kyonaji-cooking.example.com',
    '京都府', '京都市東山区', '祇園四条駅',
    20, 1, 1, 1,
    '["ja","en","zh","ko"]',
    '["JCBA認定","食品衛生責任者","文化庁認定文化体験施設"]',
    'japanese', 12, 8800,
    4.87,
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    '["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800","https://images.unsplash.com/photo-1547592180-85f173990554?w=800","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"]',
    '["https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800","https://images.unsplash.com/photo-1547592180-85f173990554?w=800"]',
    'approved', 1,
    '2023-06-01 09:00:00', NOW()
  )
`);
const demoCsId = csResult.insertId;
console.log(`  Created cooking school id=${demoCsId}`);

// 料理教室用hostsレコード（cookingSchoolタイプ）
await conn.execute("DELETE FROM hosts WHERE userId=750002");
const [csHostResult] = await conn.execute(`
  INSERT INTO hosts (
    userId, hostType, cookingSchoolId, kycStatus, approvalStatus, isActive,
    nearestStation, prefecture, city,
    languages, profileImageUrl,
    familyMemberCount, canCookTogether, hasInsurance, registrationFeePaid, trainingCompleted,
    certificationIssuedAt, interviewCompletedAt,
    createdAt, updatedAt
  ) VALUES (
    750002, 'cooking_school', ?, 'verified', 'approved', 1,
    '祇園四条駅', '京都府', '京都市東山区',
    '["ja","en","zh","ko"]',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    2, 1, 1, 1, 1,
    '2023-07-01 10:00:00', '2023-06-15 14:00:00',
    '2023-06-01 09:00:00', NOW()
  )
`, [demoCsId]);
const demoCsHostId = csHostResult.insertId;
console.log(`  Created cooking school host id=${demoCsHostId}`);

// 料理教室体験3件
await conn.execute("DELETE FROM experiences WHERE hostId=?", [demoCsHostId]);

const [csExp1] = await conn.execute(`
  INSERT INTO experiences (
    hostId, titleJa, titleEn, descriptionJa, descriptionEn,
    priceJpy, durationMinutes, maxGuests, minGuests,
    cuisineType, dietaryOptions, experienceType,
    cancellationPolicy, approvalStatus, isActive,
    imageUrls, createdAt, updatedAt
  ) VALUES (
    ?, '京都本格和食体験 〜出汁の取り方から学ぶ〜',
    'Authentic Kyoto Cuisine - From Dashi to Full Course',
    '京都の老舗料理教室で、本格的な和食の基礎から学べます。昆布と鰹節の出汁の取り方、懐石料理の盛り付け、抹茶デザートまで。少人数制で丁寧に指導します。',
    'Learn authentic Japanese cuisine from the basics at a long-established Kyoto cooking school. From making dashi with kombu and katsuobushi, to kaiseki plating, to matcha desserts. Small group instruction with personal attention.',
    55000, 240, 8, 2,
    'japanese', '["vegetarian","halal","gluten_free"]', 'cooking',
    'moderate', 'approved', 1,
    '["https://images.unsplash.com/photo-1547592180-85f173990554?w=800","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800"]',
    '2023-07-01 10:00:00', NOW()
  )
`, [demoCsHostId]);
const demoCsExpId1 = csExp1.insertId;

const [csExp2] = await conn.execute(`
  INSERT INTO experiences (
    hostId, titleJa, titleEn, descriptionJa, descriptionEn,
    priceJpy, durationMinutes, maxGuests, minGuests,
    cuisineType, dietaryOptions, experienceType,
    cancellationPolicy, approvalStatus, isActive,
    imageUrls, createdAt, updatedAt
  ) VALUES (
    ?, '京都精進料理体験 〜禅の心で作る植物性料理〜',
    'Kyoto Shojin Ryori - Zen Buddhist Vegetarian Cuisine',
    '仏教寺院の精進料理を体験できる特別プログラム。動物性食材を一切使わない植物性料理の哲学と技術を学びます。ヴィーガン・ベジタリアンの方にも最適です。',
    'A special program to experience Shojin Ryori, the Buddhist temple cuisine. Learn the philosophy and techniques of plant-based cooking using no animal products. Perfect for vegans and vegetarians.',
    55000, 270, 6, 2,
    'japanese', '["vegan","vegetarian","halal","gluten_free"]', 'both',
    'moderate', 'approved', 1,
    '["https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800"]',
    '2023-08-01 10:00:00', NOW()
  )
`, [demoCsHostId]);
const demoCsExpId2 = csExp2.insertId;

const [csExp3] = await conn.execute(`
  INSERT INTO experiences (
    hostId, titleJa, titleEn, descriptionJa, descriptionEn,
    priceJpy, durationMinutes, maxGuests, minGuests,
    cuisineType, dietaryOptions, experienceType,
    cancellationPolicy, approvalStatus, isActive,
    imageUrls, createdAt, updatedAt
  ) VALUES (
    ?, '京都寿司・刺身体験 〜プロの包丁さばきを学ぶ〜',
    'Kyoto Sushi & Sashimi - Learn Professional Knife Skills',
    '本物の和包丁の使い方から、握り寿司・刺身の盛り付けまでを学ぶ上級者向けプログラム。修了後は認定証を発行します。',
    'An advanced program to learn authentic Japanese knife techniques, nigiri sushi making, and sashimi plating. A certificate is issued upon completion.',
    77000, 300, 6, 2,
    'japanese', '[]', 'cooking',
    'strict', 'approved', 1,
    '["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800"]',
    '2023-09-01 10:00:00', NOW()
  )
`, [demoCsHostId]);
const demoCsExpId3 = csExp3.insertId;

console.log(`  Created CS experiences: ${demoCsExpId1}, ${demoCsExpId2}, ${demoCsExpId3}`);

// 料理教室空き日程（平日も含む）
await conn.execute("DELETE FROM hostAvailability WHERE cookingSchoolId=?", [demoCsId]);
for (let i = 1; i <= 30; i++) {
  const d = daysLater(i);
  const dow = d.getDay();
  if (dow !== 0) { // 日曜以外
    await conn.execute(`
      INSERT INTO hostAvailability (hostId, cookingSchoolId, date, startTime, endTime, maxGuests, status)
      VALUES (NULL, ?, ?, '10:00', '14:00', 8, 'available')
    `, [demoCsId, dateStr(d)]);
    await conn.execute(`
      INSERT INTO hostAvailability (hostId, cookingSchoolId, date, startTime, endTime, maxGuests, status)
      VALUES (NULL, ?, ?, '15:00', '19:00', 8, 'available')
    `, [demoCsId, dateStr(d)]);
  }
}

// 料理教室予約10件
await conn.execute("DELETE FROM bookings WHERE hostId=?", [demoCsHostId]);
const csBookingData = [
  // completed（今月：3月）
  { guestIdx: 3, expId: demoCsExpId3, daysOffset: -4, adults: 2, children: 0, infants: 0, status: 'completed', agentFee: 0 },
  { guestIdx: 4, expId: demoCsExpId1, daysOffset: -2, adults: 6, children: 0, infants: 0, status: 'completed', agentFee: 8800 },
  // completed（先月：2月）
  { guestIdx: 0, expId: demoCsExpId1, daysOffset: -38, adults: 4, children: 0, infants: 0, status: 'completed', agentFee: 8800 },
  { guestIdx: 1, expId: demoCsExpId1, daysOffset: -44, adults: 2, children: 0, infants: 0, status: 'completed', agentFee: 0 },
  // completed（その他過去）
  { guestIdx: 2, expId: demoCsExpId2, daysOffset: -68, adults: 3, children: 0, infants: 0, status: 'completed', agentFee: 8800 },
  { guestIdx: 0, expId: demoCsExpId1, daysOffset: 5, adults: 2, children: 0, infants: 0, status: 'confirmed', agentFee: 0 },
  { guestIdx: 1, expId: demoCsExpId2, daysOffset: 10, adults: 4, children: 0, infants: 0, status: 'confirmed', agentFee: 8800 },
  { guestIdx: 2, expId: demoCsExpId3, daysOffset: 18, adults: 2, children: 0, infants: 0, status: 'confirmed', agentFee: 0 },
  { guestIdx: 3, expId: demoCsExpId1, daysOffset: 25, adults: 3, children: 0, infants: 0, status: 'pending', agentFee: 0 },
  { guestIdx: 4, expId: demoCsExpId2, daysOffset: 32, adults: 5, children: 0, infants: 0, status: 'pending', agentFee: 8800 },
];

for (const b of csBookingData) {
  const guestId = guestIds[b.guestIdx];
  const startTime = b.daysOffset < 0 ? daysAgo(-b.daysOffset) : daysLater(b.daysOffset);
  startTime.setHours(10, 0, 0, 0);
  const endTime = new Date(startTime);
  endTime.setHours(14, 0, 0, 0);

  const BASE = 55000;
  const EXTRA_ADULT = 22000;
  const extraAdult = Math.max(0, b.adults - 2) * EXTRA_ADULT;
  const amountJpy = BASE + extraAdult;
  const cardFee = Math.round(amountJpy * 0.05);
  const hostPayout = 25000;
  const serviceFee = amountJpy - hostPayout;

  await conn.execute(`
    INSERT INTO bookings (
      guestId, hostId, experienceId, agentId,
      startTime, endTime,
      adultsCount, childrenCount, infantsCount,
      basePriceJpy, extraAdultPriceJpy, extraChildPriceJpy, extraInfantPriceJpy,
      amountTotal, currency, exchangeRateToJpy, amountJpy,
      serviceFeeJpy, hostPayoutJpy, agentFeeJpy, cardFeeJpy, affiliateFeeJpy,
      platformProfitJpy, pickupStation,
      status, confirmedAt, completedAt,
      videoCallRequired, videoCallCompletedAt,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, NULL,
      ?, ?,
      ?, 0, 0,
      ?, ?, 0, 0,
      ?, 'JPY', 1.000000, ?,
      ?, ?, ?, ?, 0,
      ?, '祇園四条駅',
      ?, ?, ?,
      0, NULL,
      NOW(), NOW()
    )
  `, [
    guestId, demoCsHostId, b.expId,
    startTime, endTime,
    b.adults,
    BASE, extraAdult,
    amountJpy, amountJpy,
    serviceFee, hostPayout, b.agentFee, cardFee,
    amountJpy - hostPayout - b.agentFee - cardFee,
    b.status,
    b.status !== 'pending' ? startTime : null,
    b.status === 'completed' ? endTime : null,
  ]);
}
console.log('  Created 10 CS bookings');

// 料理教室レビュー
const csReviewTexts = [
  { en: 'The best cooking class I have ever taken! The instructor was incredibly knowledgeable and patient. I learned so much about Japanese cuisine.', ja: '今まで受けた中で最高の料理教室です！インストラクターは非常に知識豊富で忍耐強かったです。日本料理についてとても多くを学びました。', rating: 5, food: 5, host: 5 },
  { en: 'Absolutely loved the Shojin Ryori class. As a vegan, I was thrilled to find a class that caters to my dietary needs while teaching authentic Japanese cuisine.', ja: '精進料理クラスが大好きでした。ヴィーガンとして、本格的な日本料理を教えながら私の食事制限に対応してくれるクラスを見つけられて嬉しかったです。', rating: 5, food: 5, host: 5 },
  { en: 'Great experience! The knife skills class was challenging but very rewarding. I now have a certificate to show off back home!', ja: '素晴らしい体験でした！包丁技術のクラスは難しかったですが、とてもやりがいがありました。帰国後に見せびらかせる認定証をもらいました！', rating: 4, food: 4, host: 5 },
  { en: 'The dashi class was eye-opening. I never realized how much depth and complexity goes into Japanese cooking. Highly recommended!', ja: '出汁クラスは目から鱗でした。日本料理にどれほどの深みと複雑さがあるか気づきませんでした。強くお勧めします！', rating: 5, food: 5, host: 4 },
  { en: 'Wonderful experience in the heart of Kyoto. The school is beautiful and the staff are so welcoming. Will definitely return!', ja: '京都の中心部での素晴らしい体験でした。教室は美しく、スタッフはとても歓迎的でした。絶対にまた来ます！', rating: 5, food: 5, host: 5 },
];

for (let i = 0; i < 5; i++) {
  const rt = csReviewTexts[i];
  await conn.execute(`
    INSERT INTO experienceReviews (
      experienceId, cookingSchoolId, authorId, authorName,
      ratingOverall, ratingFood, ratingHost,
      titleEn, commentEn, commentJa,
      isPublished, isFlagged,
      createdAt, updatedAt
    ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, NOW())
  `, [
    demoCsId, guestIds[i],
    ['Sarah Johnson', '李 明', 'Emily Chen', 'Marie Dupont', 'Kim Jisu'][i],
    rt.rating, rt.food, rt.host,
    'Excellent cooking class!', rt.en, rt.ja,
    daysAgo(55 - i * 10),
  ]);
}
console.log('  Created 5 CS reviews');

// ─── Step 9: 代理店デモアカウント (userId=750003) ─────────────────────────────
console.log('Step 9: Creating demo agent...');
await conn.execute("DELETE FROM agentMembers WHERE userId=750003");
await conn.execute("DELETE FROM agents WHERE name='ジャパン・エクスペリエンス・トラベル（デモ）'");

const [agentResult] = await conn.execute(`
  INSERT INTO agents (
    name, nameEn, contactEmail, commissionRate, status,
    createdAt, updatedAt
  ) VALUES (
    'ジャパン・エクスペリエンス・トラベル（デモ）',
    'Japan Experience Travel (Demo)',
    'demo-agent@yumhomestay.demo',
    0.1600,
    'active',
    '2024-01-15 09:00:00', NOW()
  )
`);
const demoAgentId = agentResult.insertId;

await conn.execute(`
  INSERT INTO agentMembers (userId, agentId, role, createdAt)
  VALUES (750003, ?, 'owner', NOW())
`, [demoAgentId]);
console.log(`  Created agent id=${demoAgentId}`);

// 代理店経由の予約15件（既存ホストを使用）
// 既存の承認済みホストIDを取得
const [[host1]] = await conn.execute("SELECT id FROM hosts WHERE approvalStatus='approved' AND isActive=1 LIMIT 1");
const [[host2]] = await conn.execute("SELECT id FROM hosts WHERE approvalStatus='approved' AND isActive=1 LIMIT 1 OFFSET 1");
const [[exp_for_agent]] = await conn.execute("SELECT id FROM experiences WHERE hostId=? AND approvalStatus='approved' AND isActive=1 LIMIT 1", [host1.id]);

await conn.execute("DELETE FROM bookings WHERE agentId=?", [demoAgentId]);

const agentBookingData = [
  // completed（過去）
  { daysOffset: -90, adults: 4, status: 'completed' },
  { daysOffset: -75, adults: 2, status: 'completed' },
  { daysOffset: -60, adults: 6, status: 'completed' },
  { daysOffset: -50, adults: 3, status: 'completed' },
  { daysOffset: -40, adults: 2, status: 'completed' },
  { daysOffset: -30, adults: 4, status: 'completed' },
  { daysOffset: -20, adults: 2, status: 'completed' },
  { daysOffset: -10, adults: 5, status: 'completed' },
  // confirmed（今後）
  { daysOffset: 7, adults: 2, status: 'confirmed' },
  { daysOffset: 14, adults: 4, status: 'confirmed' },
  { daysOffset: 21, adults: 3, status: 'confirmed' },
  { daysOffset: 28, adults: 2, status: 'confirmed' },
  // pending
  { daysOffset: 35, adults: 4, status: 'pending' },
  { daysOffset: 42, adults: 2, status: 'pending' },
  { daysOffset: 49, adults: 6, status: 'pending' },
];

for (const b of agentBookingData) {
  const guestId = guestIds[b.daysOffset % guestIds.length < 0 ? 0 : b.daysOffset % guestIds.length];
  const hostId = b.daysOffset % 2 === 0 ? host1.id : (host2 ? host2.id : host1.id);
  const expId = exp_for_agent.id;
  const startTime = b.daysOffset < 0 ? daysAgo(-b.daysOffset) : daysLater(b.daysOffset);
  startTime.setHours(10, 0, 0, 0);
  const endTime = new Date(startTime);
  endTime.setHours(14, 0, 0, 0);

  const BASE = 55000;
  const EXTRA_ADULT = 22000;
  const extraAdult = Math.max(0, b.adults - 2) * EXTRA_ADULT;
  const amountJpy = BASE + extraAdult;
  const agentFee = 8800;
  const cardFee = Math.round(amountJpy * 0.05);
  const hostPayout = 25000;
  const serviceFee = amountJpy - hostPayout;

  await conn.execute(`
    INSERT INTO bookings (
      guestId, hostId, experienceId, agentId,
      startTime, endTime,
      adultsCount, childrenCount, infantsCount,
      basePriceJpy, extraAdultPriceJpy, extraChildPriceJpy, extraInfantPriceJpy,
      amountTotal, currency, exchangeRateToJpy, amountJpy,
      serviceFeeJpy, hostPayoutJpy, agentFeeJpy, cardFeeJpy, affiliateFeeJpy,
      platformProfitJpy, pickupStation,
      status, confirmedAt, completedAt,
      videoCallRequired,
      createdAt, updatedAt
    ) VALUES (
      ?, ?, ?, ?,
      ?, ?,
      ?, 0, 0,
      ?, ?, 0, 0,
      ?, 'JPY', 1.000000, ?,
      ?, ?, ?, ?, 0,
      ?, '最寄り駅',
      ?, ?, ?,
      1,
      NOW(), NOW()
    )
  `, [
    guestId, hostId, expId, demoAgentId,
    startTime, endTime,
    b.adults,
    BASE, extraAdult,
    amountJpy, amountJpy,
    serviceFee, hostPayout, agentFee, cardFee,
    amountJpy - hostPayout - agentFee - cardFee,
    b.status,
    b.status !== 'pending' ? startTime : null,
    b.status === 'completed' ? endTime : null,
  ]);
}
console.log('  Created 15 agent bookings');

// ─── Step 10: 通知データ ──────────────────────────────────────────────────────
console.log('Step 10: Creating demo notifications...');
await conn.execute("DELETE FROM notifications WHERE userId IN (750001, 750002, 750003)");

const notifData = [
  { userId: 750001, type: 'booking_confirmed', titleJa: '予約が確定しました', titleEn: 'Booking Confirmed', bodyJa: 'Sarah Johnsonさんの予約が確定しました。体験日: 7日後', bodyEn: 'Booking with Sarah Johnson has been confirmed. Experience date: in 7 days' },
  { userId: 750001, type: 'review_received', titleJa: '新しいレビューが届きました', titleEn: 'New Review Received', bodyJa: '李 明さんから5つ星のレビューをいただきました！', bodyEn: 'You received a 5-star review from Li Ming!' },
  { userId: 750001, type: 'payout_scheduled', titleJa: '報酬振込予定', titleEn: 'Payout Scheduled', bodyJa: '今月の報酬 ¥125,000 が月末に振り込まれます', bodyEn: 'Your monthly payout of ¥125,000 is scheduled for end of month' },
  { userId: 750002, type: 'booking_confirmed', titleJa: '予約が確定しました', titleEn: 'Booking Confirmed', bodyJa: 'Emily Chenさんの予約が確定しました。体験日: 5日後', bodyEn: 'Booking with Emily Chen has been confirmed. Experience date: in 5 days' },
  { userId: 750002, type: 'review_received', titleJa: '新しいレビューが届きました', titleEn: 'New Review Received', bodyJa: 'Sarah Johnsonさんから5つ星のレビューをいただきました！', bodyEn: 'You received a 5-star review from Sarah Johnson!' },
  { userId: 750003, type: 'booking_confirmed', titleJa: '紹介予約が確定しました', titleEn: 'Referral Booking Confirmed', bodyJa: '紹介した予約が確定しました。手数料 ¥8,800 が発生します', bodyEn: 'Your referred booking has been confirmed. Commission of ¥8,800 will be paid' },
  { userId: 750003, type: 'payout_scheduled', titleJa: '手数料振込予定', titleEn: 'Commission Payout Scheduled', bodyJa: '今月の手数料合計 ¥105,600 が月末に振り込まれます', bodyEn: 'Your monthly commission of ¥105,600 is scheduled for end of month' },
];

for (const n of notifData) {
  await conn.execute(`
    INSERT INTO notifications (userId, type, titleJa, titleEn, bodyJa, bodyEn, isRead, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, 0, NOW())
  `, [n.userId, n.type, n.titleJa, n.titleEn, n.bodyJa, n.bodyEn]);
}
console.log('  Created 7 notifications');

// ─── 完了 ─────────────────────────────────────────────────────────────────────
await conn.end();
console.log('\n✅ Demo data seeding completed!');
console.log(`  Host demo: userId=750001, hostId=${demoHostId}, experiences=${demoExpId1},${demoExpId2},${demoExpId3}`);
console.log(`  Cooking school demo: userId=750002, csId=${demoCsId}, hostId=${demoCsHostId}`);
console.log(`  Agent demo: userId=750003, agentId=${demoAgentId}`);
