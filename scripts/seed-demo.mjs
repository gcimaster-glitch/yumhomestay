/**
 * YumHomeStay Demo Data Seed Script
 * 47都道府県の名物料理体験デモデータを投入する
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);

// ─── 47都道府県 名物料理データ ───────────────────────────────────────────────
const prefectureData = [
  { prefecture: "北海道", city: "札幌市", dish: "石狩鍋", dishEn: "Ishikari Nabe (Salmon Hot Pot)", station: "札幌駅", lat: 43.0618, lng: 141.3545 },
  { prefecture: "青森県", city: "青森市", dish: "せんべい汁", dishEn: "Senbei Jiru (Rice Cracker Soup)", station: "青森駅", lat: 40.8244, lng: 140.7400 },
  { prefecture: "岩手県", city: "盛岡市", dish: "わんこそば", dishEn: "Wanko Soba (Bite-sized Buckwheat Noodles)", station: "盛岡駅", lat: 39.7036, lng: 141.1527 },
  { prefecture: "宮城県", city: "仙台市", dish: "ずんだ餅", dishEn: "Zunda Mochi (Edamame Rice Cake)", station: "仙台駅", lat: 38.2682, lng: 140.8694 },
  { prefecture: "秋田県", city: "秋田市", dish: "きりたんぽ鍋", dishEn: "Kiritanpo Nabe (Rice Stick Hot Pot)", station: "秋田駅", lat: 39.7186, lng: 140.1023 },
  { prefecture: "山形県", city: "山形市", dish: "芋煮", dishEn: "Imoni (Taro Potato Stew)", station: "山形駅", lat: 38.2404, lng: 140.3634 },
  { prefecture: "福島県", city: "会津若松市", dish: "こづゆ", dishEn: "Kozuyu (Traditional Festive Soup)", station: "会津若松駅", lat: 37.4942, lng: 139.9300 },
  { prefecture: "茨城県", city: "水戸市", dish: "納豆料理", dishEn: "Natto Dishes (Fermented Soybean Cuisine)", station: "水戸駅", lat: 36.3418, lng: 140.4468 },
  { prefecture: "栃木県", city: "宇都宮市", dish: "餃子", dishEn: "Gyoza (Pan-fried Dumplings)", station: "宇都宮駅", lat: 36.5551, lng: 139.8830 },
  { prefecture: "群馬県", city: "前橋市", dish: "おっきりこみ", dishEn: "Okkirikomi (Flat Noodle Hot Pot)", station: "前橋駅", lat: 36.3906, lng: 139.0608 },
  { prefecture: "埼玉県", city: "さいたま市", dish: "冷汁うどん", dishEn: "Hiyajiru Udon (Cold Soup Udon)", station: "大宮駅", lat: 35.9062, lng: 139.6237 },
  { prefecture: "千葉県", city: "千葉市", dish: "太巻き祭り寿司", dishEn: "Futomaki Festival Sushi (Decorative Thick Rolls)", station: "千葉駅", lat: 35.6074, lng: 140.1065 },
  { prefecture: "東京都", city: "江戸川区", dish: "深川めし", dishEn: "Fukagawa Meshi (Clam Rice Bowl)", station: "門前仲町駅", lat: 35.6762, lng: 139.7993 },
  { prefecture: "神奈川県", city: "横浜市", dish: "横浜中華街の点心", dishEn: "Yokohama Chinatown Dim Sum", station: "元町・中華街駅", lat: 35.4437, lng: 139.6380 },
  { prefecture: "新潟県", city: "新潟市", dish: "のっぺ汁", dishEn: "Noppe Jiru (Root Vegetable Stew)", station: "新潟駅", lat: 37.9161, lng: 139.0364 },
  { prefecture: "富山県", city: "富山市", dish: "ます寿司", dishEn: "Masu Zushi (Trout Pressed Sushi)", station: "富山駅", lat: 36.6953, lng: 137.2113 },
  { prefecture: "石川県", city: "金沢市", dish: "治部煮", dishEn: "Jibu-ni (Duck and Wheat Gluten Stew)", station: "金沢駅", lat: 36.5944, lng: 136.6256 },
  { prefecture: "福井県", city: "福井市", dish: "越前そば", dishEn: "Echizen Soba (Buckwheat Noodles with Grated Daikon)", station: "福井駅", lat: 36.0652, lng: 136.2219 },
  { prefecture: "山梨県", city: "甲府市", dish: "ほうとう", dishEn: "Hoto (Flat Noodle Miso Stew)", station: "甲府駅", lat: 35.6635, lng: 138.5683 },
  { prefecture: "長野県", city: "松本市", dish: "おやき", dishEn: "Oyaki (Stuffed Grilled Dumplings)", station: "松本駅", lat: 36.2380, lng: 137.9720 },
  { prefecture: "岐阜県", city: "高山市", dish: "飛騨牛の朴葉味噌焼き", dishEn: "Hida Beef Houba Miso Yaki (Grilled on Magnolia Leaf)", station: "高山駅", lat: 36.1401, lng: 137.2520 },
  { prefecture: "静岡県", city: "静岡市", dish: "桜えびのかき揚げ", dishEn: "Sakura Ebi Kakiage (Sakura Shrimp Tempura)", station: "静岡駅", lat: 34.9756, lng: 138.3828 },
  { prefecture: "愛知県", city: "名古屋市", dish: "味噌煮込みうどん", dishEn: "Miso Nikomi Udon (Red Miso Braised Udon)", station: "名古屋駅", lat: 35.1815, lng: 136.9066 },
  { prefecture: "三重県", city: "伊勢市", dish: "伊勢うどん", dishEn: "Ise Udon (Thick Soft Udon with Dark Sauce)", station: "伊勢市駅", lat: 34.4876, lng: 136.7078 },
  { prefecture: "滋賀県", city: "大津市", dish: "鮒寿司", dishEn: "Funazushi (Fermented Crucian Carp Sushi)", station: "大津駅", lat: 35.0045, lng: 135.8685 },
  { prefecture: "京都府", city: "京都市", dish: "京料理おばんざい", dishEn: "Kyoto Obanzai (Traditional Kyoto Home Cooking)", station: "京都駅", lat: 35.0116, lng: 135.7681 },
  { prefecture: "大阪府", city: "大阪市", dish: "たこ焼き・お好み焼き", dishEn: "Takoyaki & Okonomiyaki (Osaka Soul Food)", station: "なんば駅", lat: 34.6937, lng: 135.5023 },
  { prefecture: "兵庫県", city: "神戸市", dish: "明石焼き", dishEn: "Akashiyaki (Soft Octopus Dumplings in Dashi)", station: "明石駅", lat: 34.6451, lng: 134.9977 },
  { prefecture: "奈良県", city: "奈良市", dish: "柿の葉寿司", dishEn: "Kakinoha Zushi (Sushi Wrapped in Persimmon Leaves)", station: "奈良駅", lat: 34.6851, lng: 135.8048 },
  { prefecture: "和歌山県", city: "和歌山市", dish: "めはり寿司", dishEn: "Mehari Zushi (Rice Ball Wrapped in Pickled Mustard Greens)", station: "和歌山駅", lat: 34.2306, lng: 135.1708 },
  { prefecture: "鳥取県", city: "鳥取市", dish: "カニ汁", dishEn: "Kani Jiru (Snow Crab Miso Soup)", station: "鳥取駅", lat: 35.5011, lng: 134.2351 },
  { prefecture: "島根県", city: "松江市", dish: "出雲そば", dishEn: "Izumo Soba (Dark Buckwheat Noodles in Lacquer Bowls)", station: "松江駅", lat: 35.4723, lng: 133.0505 },
  { prefecture: "岡山県", city: "岡山市", dish: "ばら寿司", dishEn: "Bara Zushi (Scattered Sushi with Seasonal Toppings)", station: "岡山駅", lat: 34.6618, lng: 133.9350 },
  { prefecture: "広島県", city: "広島市", dish: "広島風お好み焼き", dishEn: "Hiroshima-style Okonomiyaki (Layered Savory Pancake)", station: "広島駅", lat: 34.3963, lng: 132.4596 },
  { prefecture: "山口県", city: "下関市", dish: "ふぐ料理", dishEn: "Fugu Ryori (Pufferfish Cuisine)", station: "下関駅", lat: 33.9519, lng: 130.9209 },
  { prefecture: "徳島県", city: "徳島市", dish: "そば米汁", dishEn: "Sobamei Jiru (Buckwheat Berry Soup)", station: "徳島駅", lat: 34.0658, lng: 134.5593 },
  { prefecture: "香川県", city: "高松市", dish: "讃岐うどん", dishEn: "Sanuki Udon (Firm Wheat Noodles with Dashi)", station: "高松駅", lat: 34.3428, lng: 134.0466 },
  { prefecture: "愛媛県", city: "松山市", dish: "鯛めし", dishEn: "Tai Meshi (Sea Bream Rice)", station: "松山駅", lat: 33.8392, lng: 132.7657 },
  { prefecture: "高知県", city: "高知市", dish: "かつおのたたき", dishEn: "Katsuo no Tataki (Seared Bonito with Ponzu)", station: "高知駅", lat: 33.5597, lng: 133.5311 },
  { prefecture: "福岡県", city: "福岡市", dish: "博多もつ鍋", dishEn: "Hakata Motsu Nabe (Offal Hot Pot)", station: "博多駅", lat: 33.5904, lng: 130.4017 },
  { prefecture: "佐賀県", city: "佐賀市", dish: "呼子のイカ料理", dishEn: "Yobuko Squid Cuisine (Fresh Squid Dishes)", station: "佐賀駅", lat: 33.2635, lng: 130.3009 },
  { prefecture: "長崎県", city: "長崎市", dish: "ちゃんぽん", dishEn: "Champon (Nagasaki Noodle Soup with Seafood & Vegetables)", station: "長崎駅", lat: 32.7503, lng: 129.8779 },
  { prefecture: "熊本県", city: "熊本市", dish: "馬刺し・太平燕", dishEn: "Basashi & Taipien (Horse Sashimi & Glass Noodle Soup)", station: "熊本駅", lat: 32.7898, lng: 130.7417 },
  { prefecture: "大分県", city: "大分市", dish: "とり天", dishEn: "Tori Ten (Chicken Tempura Oita Style)", station: "大分駅", lat: 33.2382, lng: 131.6126 },
  { prefecture: "宮崎県", city: "宮崎市", dish: "チキン南蛮", dishEn: "Chicken Nanban (Fried Chicken with Tartar Sauce)", station: "宮崎駅", lat: 31.9111, lng: 131.4239 },
  { prefecture: "鹿児島県", city: "鹿児島市", dish: "さつま汁", dishEn: "Satsuma Jiru (Chicken and Root Vegetable Miso Soup)", station: "鹿児島中央駅", lat: 31.5602, lng: 130.5581 },
  { prefecture: "沖縄県", city: "那覇市", dish: "ゴーヤーチャンプルー", dishEn: "Goya Champuru (Bitter Melon Stir-fry)", station: "那覇空港駅", lat: 26.2124, lng: 127.6809 },
];

// ─── デモユーザー・ホスト・体験を投入 ─────────────────────────────────────────

console.log("🌱 Starting demo data seed...");

// 既存のデモデータをチェック
const [existingHosts] = await connection.execute(
  "SELECT COUNT(*) as count FROM hosts WHERE approvalStatus = 'approved'"
);
const existingCount = existingHosts[0].count;

if (existingCount >= 47) {
  console.log(`✅ Demo data already exists (${existingCount} approved hosts). Skipping.`);
  await connection.end();
  process.exit(0);
}
console.log(`Found ${existingCount} existing approved hosts. Adding remaining prefectures...`);

// デモユーザーを作成（各都道府県のホスト用）
const now = new Date();
let insertedCount = 0;

for (let i = 0; i < prefectureData.length; i++) {
  const data = prefectureData[i];
  const userEmail = `demo-host-${i + 1}@yumhomestay.demo`;
  const userName = `${data.prefecture}ホスト家族`;

  try {
    // ユーザー作成（存在しない場合のみ）
    const [existingUser] = await connection.execute(
      "SELECT id FROM users WHERE email = ?",
      [userEmail]
    );

    let userId;
    if (existingUser.length === 0) {
      const [userResult] = await connection.execute(
        `INSERT INTO users (openId, name, email, role, createdAt, updatedAt) 
         VALUES (?, ?, ?, 'user', NOW(), NOW())`,
        [`demo-host-openid-${i + 1}`, userName, userEmail]
      );
      userId = userResult.insertId;
    } else {
      userId = existingUser[0].id;
    }

    // ホスト作成（存在しない場合のみ）
    const [existingHost] = await connection.execute(
      "SELECT id FROM hosts WHERE userId = ?",
      [userId]
    );

    let hostId;
    if (existingHost.length === 0) {
      const languages = JSON.stringify(["ja", "en"]);
      const dietaryAccommodations = JSON.stringify(["vegetarian", "halal_on_request"]);
      const [hostResult] = await connection.execute(
        `INSERT INTO hosts (
          userId, hostType, kycStatus, bio, bioJa, bioEn,
          nearestStation, prefecture, city, languages,
          familyMemberCount, canCookTogether, hasInsurance,
          registrationFeePaid, trainingCompleted, dietaryAccommodations,
          minSessionHours, maxSessionHours,
          approvalStatus, isActive, createdAt, updatedAt
        ) VALUES (
          ?, 'individual', 'verified', ?, ?, ?,
          ?, ?, ?, ?,
          ?, true, true,
          true, true, ?,
          3, 5,
          'approved', true, NOW(), NOW()
        )`,
        [
          userId,
          `${data.prefecture}在住の家族です。地元の名物料理「${data.dish}」を一緒に作りましょう！`,
          `${data.prefecture}在住の家族です。地元の名物料理「${data.dish}」を一緒に作りましょう！`,
          `We are a family living in ${data.prefecture}. Let's cook "${data.dishEn}" together!`,
          data.station,
          data.prefecture,
          data.city,
          languages,
          Math.floor(Math.random() * 3) + 2, // 2〜4名
          dietaryAccommodations,
        ]
      );
      hostId = hostResult.insertId;
    } else {
      hostId = existingHost[0].id;
    }

    // 体験プログラム作成（存在しない場合のみ）
    const [existingExp] = await connection.execute(
      "SELECT id FROM experiences WHERE hostId = ?",
      [hostId]
    );

    if (existingExp.length === 0) {
      const imageUrls = JSON.stringify([
        `https://images.unsplash.com/photo-${1550000000 + i * 1000}?w=800&q=80`
      ]);
      await connection.execute(
        `INSERT INTO experiences (
          hostId, titleJa, titleEn, descriptionJa, descriptionEn,
          priceJpy, durationMinutes, maxGuests, minGuests,
          cuisineType, experienceType, cancellationPolicy,
          approvalStatus, isActive, imageUrls, createdAt, updatedAt
        ) VALUES (
          ?, ?, ?, ?, ?,
          20000, 240, 6, 2,
          'japanese', 'cooking', 'moderate',
          'approved', true, ?, NOW(), NOW()
        )`,
        [
          hostId,
          `${data.prefecture}の名物料理「${data.dish}」を作ろう！`,
          `Cook ${data.dishEn} in ${data.prefecture}!`,
          `${data.prefecture}の家庭で、地元の名物料理「${data.dish}」を一緒に作る体験です。\n\n地元の食材を使い、代々伝わるレシピで本物の家庭料理を体験しましょう。料理の後は、ホストファミリーと一緒に食卓を囲み、${data.prefecture}の文化や暮らしについてお話しします。\n\n※ビデオ面談（約10分）を事前に行います。\n※2名以上でのご参加をお願いしています。`,
          `Experience cooking "${data.dishEn}", a local specialty of ${data.prefecture}, in a real Japanese home.\n\nUsing local ingredients and time-honored family recipes, you'll learn authentic home cooking. After cooking, share a meal with your host family and learn about life and culture in ${data.prefecture}.\n\n※A 10-minute video call is required before your visit.\n※Minimum 2 guests required.`,
          imageUrls,
        ]
      );
      insertedCount++;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  Progress: ${i + 1}/47 prefectures processed`);
    }
  } catch (err) {
    console.error(`  Error processing ${data.prefecture}:`, err.message);
  }
}

console.log(`✅ Demo data seed complete! Inserted ${insertedCount} new experiences.`);
await connection.end();
