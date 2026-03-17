/**
 * YumHomeStay Host Profile Enrichment Script
 * 承認済みホストのbioJa/bioEn/hasSpecialCertificationを充実させる
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

// 47都道府県のホストプロフィールデータ
const hostProfiles = [
  {
    prefecture: "北海道",
    bioJa: "札幌市在住の田中家族です。夫婦と子供2人の4人家族で、広いキッチンで石狩鍋を一緒に作りましょう！鮭の下処理から出汁の取り方まで丁寧にお教えします。英語・中国語でも対応可能です。ホームステイ文化交流認定ホストです。",
    bioEn: "We are the Tanaka family in Sapporo, Hokkaido! A family of 4 (parents + 2 kids), we love sharing our local cuisine. Join us to make Ishikari Nabe (salmon hot pot) from scratch — we'll teach you everything from preparing the salmon to making the perfect dashi broth. English and Chinese spoken.",
    hasSpecialCertification: true,
    familyMemberCount: 4,
  },
  {
    prefecture: "青森県",
    bioJa: "青森市在住の佐藤家族です。祖父母も同居する3世代家族で、南部せんべいを使った郷土料理「せんべい汁」の作り方を伝授します。津軽三味線の演奏も少しお見せできます！英語対応可。",
    bioEn: "We are the Sato family in Aomori — a three-generation household including grandparents! We'll teach you how to make Senbei Jiru, a local hot pot using rice crackers. We can even play a little Tsugaru shamisen for you! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 5,
  },
  {
    prefecture: "岩手県",
    bioJa: "盛岡市在住の鈴木家族です。夫婦と子供3人の5人家族。わんこそばの本場で、そば打ちから挑戦してみませんか？地元の食材にこだわった家庭料理をご紹介します。英語・韓国語対応可。",
    bioEn: "The Suzuki family in Morioka, Iwate — 5 of us including 3 kids! We're in the home of Wanko Soba. Try making soba noodles from scratch and enjoy the full wanko experience. We use local Iwate ingredients throughout. English and Korean spoken.",
    hasSpecialCertification: true,
    familyMemberCount: 5,
  },
  {
    prefecture: "宮城県",
    bioJa: "仙台市在住の伊藤家族です。夫婦と子供2人の4人家族。ずんだ餅作りを通じて、東北の食文化をご紹介します。枝豆をすり潰すところから一緒に体験しましょう！英語対応可。",
    bioEn: "The Ito family in Sendai, Miyagi! We're a family of 4 and love sharing Tohoku food culture. Make Zunda Mochi together — from grinding fresh edamame to shaping the rice cakes. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "秋田県",
    bioJa: "秋田市在住の渡辺家族です。夫婦と両親の4人家族。きりたんぽ鍋の本場で、比内地鶏を使った本格的な鍋料理を一緒に作りましょう。秋田の農家民泊認定を取得しています。英語対応可。",
    bioEn: "The Watanabe family in Akita — 4 members including grandparents! We're certified agri-tourism hosts and love making authentic Kiritanpo Nabe with Hinai chicken. English spoken.",
    hasSpecialCertification: true,
    familyMemberCount: 4,
  },
  {
    prefecture: "山形県",
    bioJa: "山形市在住の山本家族です。夫婦と子供2人の4人家族。秋の風物詩「芋煮」を河原スタイルで体験！里芋の皮むきから牛肉との煮込みまで、山形の秋を感じてください。英語・中国語対応可。",
    bioEn: "The Yamamoto family in Yamagata! A family of 4, we love sharing our autumn tradition of Imoni (taro stew). We'll make it together from peeling the taro to simmering with beef — a true Yamagata autumn experience. English and Chinese spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "福島県",
    bioJa: "会津若松市在住の中村家族です。夫婦と子供3人の5人家族。会津の伝統料理「こづゆ」は冠婚葬祭に欠かせない一品。干し貝柱の出汁の取り方から、丁寧にお教えします。英語対応可。",
    bioEn: "The Nakamura family in Aizu-Wakamatsu, Fukushima — 5 members! Kozuyu is our traditional ceremonial soup. We'll teach you to make dashi from dried scallops and prepare this special dish step by step. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 5,
  },
  {
    prefecture: "茨城県",
    bioJa: "水戸市在住の小林家族です。夫婦と子供2人の4人家族。納豆の本場・水戸で、納豆を使ったさまざまな料理を体験！納豆汁・納豆チャーハン・納豆オムレツなど多彩なメニューをご用意。英語対応可。",
    bioEn: "The Kobayashi family in Mito, the home of natto! A family of 4, we'll show you all the amazing things you can do with fermented soybeans — natto soup, natto fried rice, natto omelette and more. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "栃木県",
    bioJa: "宇都宮市在住の加藤家族です。夫婦と子供2人の4人家族。餃子の街・宇都宮で、本格餃子を一から手作り！皮の伸ばし方から包み方まで、家族みんなで楽しく体験できます。英語・中国語対応可。",
    bioEn: "The Kato family in Utsunomiya — Japan's gyoza capital! A family of 4, we make gyoza completely from scratch, from rolling the wrappers to the perfect fold. Fun for all ages! English and Chinese spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "群馬県",
    bioJa: "前橋市在住の吉田家族です。夫婦と子供2人の4人家族。上州の郷土料理「おっきりこみ」は、手打ち麺と根菜の組み合わせが絶品！麺打ちから一緒に体験しましょう。英語対応可。",
    bioEn: "The Yoshida family in Maebashi, Gunma! A family of 4, we love making Okkirikomi — hand-cut flat noodles simmered with root vegetables in miso broth. You'll make the noodles from scratch! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "埼玉県",
    bioJa: "さいたま市在住の山田家族です。夫婦と子供2人の4人家族。埼玉の夏の定番「冷汁うどん」は暑い日にぴったり！うどんを手打ちして、冷たい汁と一緒にどうぞ。英語対応可。",
    bioEn: "The Yamada family in Saitama City! A family of 4, we make Hiyajiru Udon — hand-made udon noodles served with cold sesame-miso soup, perfect for hot days. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "千葉県",
    bioJa: "千葉市在住の佐々木家族です。夫婦と子供3人の5人家族。千葉の伝統「太巻き祭り寿司」は、切り口に花や動物が現れる芸術的な巻き寿司！一緒に挑戦しましょう。英語対応可。",
    bioEn: "The Sasaki family in Chiba City — 5 members! Futomaki Festival Sushi is an art form — when you cut the roll, beautiful patterns of flowers and animals appear. We'll make this together! English spoken.",
    hasSpecialCertification: true,
    familyMemberCount: 5,
  },
  {
    prefecture: "東京都",
    bioJa: "江戸川区在住の松本家族です。夫婦と子供2人の4人家族。下町の郷土料理「深川めし」は、アサリの旨味が凝縮した一品。江戸前の食文化を体験してください。英語・中国語・韓国語対応可。",
    bioEn: "The Matsumoto family in Edogawa, Tokyo! A family of 4, we make Fukagawa Meshi — a traditional Edo-style clam rice dish from the shitamachi (old town) area. English, Chinese, and Korean spoken.",
    hasSpecialCertification: true,
    familyMemberCount: 4,
  },
  {
    prefecture: "神奈川県",
    bioJa: "横浜市在住の井上家族です。夫婦と子供2人の4人家族。横浜中華街近くに住む私たちが、本格点心（餃子・焼売・小籠包）の作り方をご紹介！英語・中国語対応可。",
    bioEn: "The Inoue family in Yokohama, near Chinatown! A family of 4, we'll teach you to make authentic dim sum — gyoza, shumai, and xiaolongbao. English and Chinese spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "新潟県",
    bioJa: "新潟市在住の木村家族です。夫婦と子供2人の4人家族。越後の郷土料理「のっぺ汁」は、根菜と鶏肉の優しい味わい。新潟産コシヒカリと一緒にどうぞ。英語対応可。",
    bioEn: "The Kimura family in Niigata City! A family of 4, we make Noppe Jiru — a hearty root vegetable and chicken stew, served with Niigata's famous Koshihikari rice. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "富山県",
    bioJa: "富山市在住の林家族です。夫婦と子供2人の4人家族。ます寿司は富山の誇る押し寿司！サクラマスの塩加減から酢飯の作り方まで、丁寧にお教えします。英語対応可。",
    bioEn: "The Hayashi family in Toyama City! A family of 4, we make Masu Zushi — Toyama's famous pressed trout sushi. We'll teach you everything from salting the trout to making perfect sushi rice. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "石川県",
    bioJa: "金沢市在住の清水家族です。夫婦と子供2人の4人家族。加賀料理の代表「治部煮」は、鴨肉とすだれ麩の上品な煮物。金沢の食文化を体験してください。英語対応可。",
    bioEn: "The Shimizu family in Kanazawa, Ishikawa! A family of 4, we make Jibu-ni — an elegant Kaga cuisine dish of duck and wheat gluten simmered in a refined dashi broth. English spoken.",
    hasSpecialCertification: true,
    familyMemberCount: 4,
  },
  {
    prefecture: "福井県",
    bioJa: "福井市在住の山口家族です。夫婦と子供2人の4人家族。越前そばは大根おろしとともに食べる独特のスタイル！そば打ちから体験できます。英語対応可。",
    bioEn: "The Yamaguchi family in Fukui City! A family of 4, we make Echizen Soba — buckwheat noodles served with grated daikon radish in a unique Fukui style. Try making soba from scratch! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "山梨県",
    bioJa: "甲府市在住の松田家族です。夫婦と子供2人の4人家族。富士山麓の郷土料理「ほうとう」は、平打ち麺と野菜の味噌仕立て。山梨の食文化を体験してください。英語対応可。",
    bioEn: "The Matsuda family in Kofu, Yamanashi — at the foot of Mt. Fuji! A family of 4, we make Hoto — flat noodles and vegetables simmered in miso broth, a local winter staple. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "長野県",
    bioJa: "松本市在住の藤田家族です。夫婦と子供3人の5人家族。信州の郷土料理「おやき」は、野菜や山菜を包んだ蒸し焼き饅頭。具材から一緒に作りましょう。英語対応可。",
    bioEn: "The Fujita family in Matsumoto, Nagano — 5 members! We make Oyaki — steamed/grilled dumplings stuffed with vegetables and mountain greens, a Shinshu specialty. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 5,
  },
  {
    prefecture: "岐阜県",
    bioJa: "高山市在住の岡田家族です。夫婦と子供2人の4人家族。飛騨牛の朴葉味噌焼きは、朴の葉の香りが食欲をそそる一品！飛騨の食文化を体験してください。英語対応可。",
    bioEn: "The Okada family in Takayama, Gifu! A family of 4, we make Hida Beef Houba Miso Yaki — premium Hida beef grilled on a magnolia leaf with miso, filling your kitchen with amazing aromas. English spoken.",
    hasSpecialCertification: true,
    familyMemberCount: 4,
  },
  {
    prefecture: "静岡県",
    bioJa: "静岡市在住の田村家族です。夫婦と子供2人の4人家族。桜えびのかき揚げは、駿河湾の恵み！新鮮な桜えびを使った天ぷらの揚げ方をお教えします。英語対応可。",
    bioEn: "The Tamura family in Shizuoka City! A family of 4, we make Sakura Ebi Kakiage — crispy tempura fritters with fresh sakura shrimp from Suruga Bay. We'll teach you perfect tempura technique. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "愛知県",
    bioJa: "名古屋市在住の中島家族です。夫婦と子供2人の4人家族。名古屋めしの代表「味噌煮込みうどん」は、赤味噌の濃厚な味わいが特徴。土鍋で一緒に作りましょう。英語・中国語対応可。",
    bioEn: "The Nakajima family in Nagoya, Aichi! A family of 4, we make Miso Nikomi Udon — thick udon noodles simmered in rich red miso broth in a clay pot. A true Nagoya experience! English and Chinese spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "三重県",
    bioJa: "伊勢市在住の村上家族です。夫婦と子供2人の4人家族。伊勢うどんは太くてやわらかい麺に濃いタレをかけるシンプルな料理。伊勢神宮参拝後にぜひ！英語対応可。",
    bioEn: "The Murakami family in Ise City, Mie! A family of 4, we make Ise Udon — thick, soft noodles with a rich dark sauce, a simple but deeply satisfying dish. Perfect after visiting Ise Jingu! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "滋賀県",
    bioJa: "大津市在住の橋本家族です。夫婦と子供2人の4人家族。鮒寿司は日本最古の発酵食品！その独特の風味と歴史をご紹介します（食べるのが苦手な方には他の滋賀料理もご用意）。英語対応可。",
    bioEn: "The Hashimoto family in Otsu, Shiga! A family of 4, we introduce Funazushi — Japan's oldest fermented sushi. We'll share its unique flavor and history (alternative Shiga dishes available for those who prefer). English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "京都府",
    bioJa: "京都市在住の石川家族です。夫婦と子供2人の4人家族。京料理の真髄「おばんざい」は、旬の食材を使った家庭料理の数々。だしの取り方から丁寧にお教えします。英語・中国語・韓国語対応可。ホームステイ文化交流認定ホスト。",
    bioEn: "The Ishikawa family in Kyoto! A family of 4, we teach Obanzai — traditional Kyoto home cooking using seasonal ingredients. We start with dashi-making and work through multiple small dishes. English, Chinese, and Korean spoken. Certified cultural exchange host.",
    hasSpecialCertification: true,
    familyMemberCount: 4,
  },
  {
    prefecture: "大阪府",
    bioJa: "大阪市在住の前田家族です。夫婦と子供3人の5人家族。たこ焼き・お好み焼きの本場で、大阪のソウルフードを一緒に作りましょう！たこ焼き器を使った本格体験。英語・中国語・韓国語対応可。",
    bioEn: "The Maeda family in Osaka — 5 members! We're in the home of Takoyaki and Okonomiyaki. Make both together using our takoyaki iron and griddle. A true Osaka soul food experience! English, Chinese, and Korean spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 5,
  },
  {
    prefecture: "兵庫県",
    bioJa: "明石市在住の藤原家族です。夫婦と子供2人の4人家族。明石焼きはたこ焼きとは一線を画す、ふわふわ食感の卵焼き。出汁につけて食べる独特のスタイルをご体験ください。英語対応可。",
    bioEn: "The Fujiwara family in Akashi, Hyogo! A family of 4, we make Akashiyaki — fluffy egg dumplings with octopus, dipped in dashi broth. Quite different from Osaka's takoyaki! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "奈良県",
    bioJa: "奈良市在住の岡本家族です。夫婦と子供2人の4人家族。柿の葉寿司は奈良の伝統的な押し寿司。柿の葉の抗菌作用を活かした先人の知恵を体験してください。英語対応可。",
    bioEn: "The Okamoto family in Nara City! A family of 4, we make Kakinoha Zushi — pressed sushi wrapped in persimmon leaves, using the leaf's natural antibacterial properties. Ancient wisdom meets delicious food! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "和歌山県",
    bioJa: "和歌山市在住の中田家族です。夫婦と子供2人の4人家族。めはり寿司は高菜の漬物でおにぎりを包んだシンプルな料理。紀州の食文化をご紹介します。英語対応可。",
    bioEn: "The Nakata family in Wakayama City! A family of 4, we make Mehari Zushi — simple rice balls wrapped in pickled mustard greens, a beloved Kishu tradition. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "鳥取県",
    bioJa: "鳥取市在住の上田家族です。夫婦と子供2人の4人家族。松葉ガニの本場・鳥取で、カニ汁の作り方をご紹介！新鮮なカニの旨味が凝縮した味噌汁です。英語対応可。",
    bioEn: "The Ueda family in Tottori City! A family of 4, we make Kani Jiru — rich miso soup with fresh snow crab, a specialty of Tottori, Japan's crab capital. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "島根県",
    bioJa: "松江市在住の池田家族です。夫婦と子供2人の4人家族。出雲そばは割子そばスタイルで食べる独特の文化。そば打ちから体験できます。英語対応可。",
    bioEn: "The Ikeda family in Matsue, Shimane! A family of 4, we make Izumo Soba — dark buckwheat noodles served in lacquer bowls (warigo style). Try making soba from scratch! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "岡山県",
    bioJa: "岡山市在住の長谷川家族です。夫婦と子供2人の4人家族。ばら寿司は岡山の祭り寿司！旬の食材を彩り豊かに盛り付けた散らし寿司を一緒に作りましょう。英語対応可。",
    bioEn: "The Hasegawa family in Okayama City! A family of 4, we make Bara Zushi — Okayama's festive scattered sushi with colorful seasonal toppings. A beautiful and delicious experience! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "広島県",
    bioJa: "広島市在住の石田家族です。夫婦と子供2人の4人家族。広島風お好み焼きは、大阪風とは違う重ね焼きスタイル！鉄板を使った本格体験をご提供します。英語・韓国語対応可。",
    bioEn: "The Ishida family in Hiroshima City! A family of 4, we make Hiroshima-style Okonomiyaki — layered pancakes with noodles, quite different from Osaka style. Full iron griddle experience! English and Korean spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "山口県",
    bioJa: "下関市在住の河野家族です。夫婦と子供2人の4人家族。ふぐ料理の本場・下関で、ふぐ刺し・ふぐ鍋（てっちり）の作り方をご紹介！（ふぐ調理師免許保有）英語対応可。",
    bioEn: "The Kono family in Shimonoseki, Yamaguchi — the home of fugu! A family of 4, we introduce fugu cuisine including fugu sashimi and hot pot (tetchiri). Our host holds a fugu chef license! English spoken.",
    hasSpecialCertification: true,
    familyMemberCount: 4,
  },
  {
    prefecture: "徳島県",
    bioJa: "徳島市在住の近藤家族です。夫婦と子供2人の4人家族。そば米汁は徳島独特のそばの実を使ったスープ。阿波踊りの文化とともに徳島の食をご紹介します。英語対応可。",
    bioEn: "The Kondo family in Tokushima City! A family of 4, we make Sobamei Jiru — a unique Tokushima soup using buckwheat berries. We'll also share the culture of Awa Odori dance! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "香川県",
    bioJa: "高松市在住の太田家族です。夫婦と子供3人の5人家族。うどん県・香川で、讃岐うどんを手打ち体験！コシのある麺の作り方を丁寧にお教えします。英語・中国語対応可。",
    bioEn: "The Ota family in Takamatsu, Kagawa — the Udon Prefecture! A family of 5, we make Sanuki Udon from scratch — kneading, resting, and cutting the perfect firm noodles. English and Chinese spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 5,
  },
  {
    prefecture: "愛媛県",
    bioJa: "松山市在住の三浦家族です。夫婦と子供2人の4人家族。鯛めしは愛媛の誇る郷土料理。新鮮な鯛を使った炊き込みご飯の作り方をご紹介します。英語対応可。",
    bioEn: "The Miura family in Matsuyama, Ehime! A family of 4, we make Tai Meshi — sea bream rice cooked in a clay pot with dashi. Fresh sea bream from the Seto Inland Sea! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "高知県",
    bioJa: "高知市在住の西村家族です。夫婦と子供2人の4人家族。かつおのたたきは高知の代名詞！藁焼きの本格体験と、ポン酢・にんにくとの食べ方をご紹介します。英語対応可。",
    bioEn: "The Nishimura family in Kochi City! A family of 4, we make Katsuo no Tataki — seared bonito with ponzu sauce, the symbol of Kochi cuisine. Experience straw-fire searing! English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "福岡県",
    bioJa: "福岡市在住の森家族です。夫婦と子供2人の4人家族。博多もつ鍋は、もつの旨味とニラ・キャベツの甘みが絶妙な鍋料理。博多の食文化を体験してください。英語・韓国語対応可。",
    bioEn: "The Mori family in Fukuoka City! A family of 4, we make Hakata Motsu Nabe — offal hot pot with garlic chives and cabbage, a Fukuoka specialty. English and Korean spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "佐賀県",
    bioJa: "佐賀市在住の原田家族です。夫婦と子供2人の4人家族。呼子のイカは日本一の鮮度！イカの活き造りから、イカ墨を使った料理まで、佐賀の海の幸をご紹介します。英語対応可。",
    bioEn: "The Harada family in Saga City! A family of 4, we introduce Yobuko squid cuisine — the freshest squid in Japan! From squid sashimi to squid ink dishes. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "長崎県",
    bioJa: "長崎市在住の山崎家族です。夫婦と子供2人の4人家族。ちゃんぽんは長崎の中華文化が生んだ麺料理。豚骨スープのベースから野菜・海鮮の炒め方まで丁寧にお教えします。英語・中国語対応可。",
    bioEn: "The Yamazaki family in Nagasaki City! A family of 4, we make Champon — Nagasaki's unique noodle soup born from Chinese culinary influence. From making the pork bone broth to stir-frying seafood and vegetables. English and Chinese spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "熊本県",
    bioJa: "熊本市在住の松井家族です。夫婦と子供2人の4人家族。馬刺しは熊本の誇り！新鮮な馬刺しの切り方と、太平燕（タイピーエン）の作り方をご紹介します。英語対応可。",
    bioEn: "The Matsui family in Kumamoto City! A family of 4, we introduce Basashi (horse sashimi) and Taipien (glass noodle soup) — two Kumamoto specialties. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "大分県",
    bioJa: "大分市在住の高橋家族です。夫婦と子供2人の4人家族。とり天は大分のソウルフード！鶏肉の下処理から揚げ方まで、カラッとした天ぷらの作り方をお教えします。英語対応可。",
    bioEn: "The Takahashi family in Oita City! A family of 4, we make Tori Ten — Oita-style chicken tempura, a local soul food. We'll teach you everything from marinating to perfect frying. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "宮崎県",
    bioJa: "宮崎市在住の坂本家族です。夫婦と子供2人の4人家族。チキン南蛮は宮崎発祥の揚げ鶏料理！甘酢タレとタルタルソースの作り方から丁寧にお教えします。英語対応可。",
    bioEn: "The Sakamoto family in Miyazaki City! A family of 4, we make Chicken Nanban — Miyazaki's famous fried chicken with sweet vinegar sauce and homemade tartar sauce. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "鹿児島県",
    bioJa: "鹿児島市在住の福田家族です。夫婦と子供2人の4人家族。さつま汁は鶏肉と根菜の味噌仕立て。薩摩の食文化と黒豚・黒牛の話も交えながらご紹介します。英語対応可。",
    bioEn: "The Fukuda family in Kagoshima City! A family of 4, we make Satsuma Jiru — chicken and root vegetable miso soup, a Kagoshima staple. We'll also share stories of Kagoshima's famous black pork and beef. English spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 4,
  },
  {
    prefecture: "沖縄県",
    bioJa: "那覇市在住の宮城家族です。夫婦と子供3人の5人家族。ゴーヤーチャンプルーは沖縄の定番家庭料理！豆腐・ポークランチョンミートとの炒め方をご紹介します。英語・中国語対応可。",
    bioEn: "The Miyagi family in Naha, Okinawa — 5 members! We make Goya Champuru — bitter melon stir-fry with tofu and Spam, the ultimate Okinawan home cooking. English and Chinese spoken.",
    hasSpecialCertification: false,
    familyMemberCount: 5,
  },
];

console.log("🌱 Starting host profile enrichment...");

let updatedCount = 0;

for (const profile of hostProfiles) {
  try {
    // 都道府県名でホストを特定（prefectureカラムで検索）
    const [hosts] = await connection.execute(
      "SELECT id FROM hosts WHERE prefecture = ? AND approvalStatus = 'approved' ORDER BY id LIMIT 1",
      [profile.prefecture]
    );

    if (hosts.length === 0) {
      console.log(`  ⚠️  No approved host found for ${profile.prefecture}`);
      continue;
    }

    const hostId = hosts[0].id;

    await connection.execute(
      `UPDATE hosts SET 
        bioJa = ?, 
        bioEn = ?, 
        hasSpecialCertification = ?,
        familyMemberCount = ?,
        updatedAt = NOW()
      WHERE id = ?`,
      [
        profile.bioJa,
        profile.bioEn,
        profile.hasSpecialCertification ? 1 : 0,
        profile.familyMemberCount,
        hostId,
      ]
    );

    updatedCount++;
    if (updatedCount % 10 === 0) {
      console.log(`  Progress: ${updatedCount}/${hostProfiles.length} hosts updated`);
    }
  } catch (err) {
    console.error(`  Error updating ${profile.prefecture}:`, err.message);
  }
}

console.log(`✅ Host profile enrichment complete! Updated ${updatedCount} hosts.`);
await connection.end();
