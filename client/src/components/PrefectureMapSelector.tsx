/**
 * PrefectureMapSelector
 * 都道府県をドロップダウンで選択し、Googleマップで位置を確認できる入力補助コンポーネント。
 * マップ上の任意の地点をクリックすると逆ジオコーディングで最寄りの都道府県を自動選択する。
 * 資料請求フォーム・本登録フォームのステップ1に組み込む。
 */
import { useRef, useState } from "react";
import { MapView } from "@/components/Map";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";

export const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

// 都道府県の中心座標（ジオコーディング用フォールバック）
const PREFECTURE_COORDS: Record<string, { lat: number; lng: number }> = {
  "北海道": { lat: 43.0642, lng: 141.3469 },
  "青森県": { lat: 40.8244, lng: 140.7400 },
  "岩手県": { lat: 39.7036, lng: 141.1527 },
  "宮城県": { lat: 38.2688, lng: 140.8721 },
  "秋田県": { lat: 39.7186, lng: 140.1023 },
  "山形県": { lat: 38.2404, lng: 140.3634 },
  "福島県": { lat: 37.7500, lng: 140.4676 },
  "茨城県": { lat: 36.3418, lng: 140.4468 },
  "栃木県": { lat: 36.5658, lng: 139.8836 },
  "群馬県": { lat: 36.3912, lng: 139.0608 },
  "埼玉県": { lat: 35.8570, lng: 139.6489 },
  "千葉県": { lat: 35.6073, lng: 140.1063 },
  "東京都": { lat: 35.6762, lng: 139.6503 },
  "神奈川県": { lat: 35.4478, lng: 139.6425 },
  "新潟県": { lat: 37.9026, lng: 139.0232 },
  "富山県": { lat: 36.6953, lng: 137.2113 },
  "石川県": { lat: 36.5947, lng: 136.6256 },
  "福井県": { lat: 36.0652, lng: 136.2216 },
  "山梨県": { lat: 35.6635, lng: 138.5684 },
  "長野県": { lat: 36.6513, lng: 138.1810 },
  "岐阜県": { lat: 35.3912, lng: 136.7223 },
  "静岡県": { lat: 34.9769, lng: 138.3831 },
  "愛知県": { lat: 35.1802, lng: 136.9066 },
  "三重県": { lat: 34.7303, lng: 136.5086 },
  "滋賀県": { lat: 35.0045, lng: 135.8686 },
  "京都府": { lat: 35.0211, lng: 135.7556 },
  "大阪府": { lat: 34.6937, lng: 135.5023 },
  "兵庫県": { lat: 34.6913, lng: 135.1830 },
  "奈良県": { lat: 34.6851, lng: 135.8050 },
  "和歌山県": { lat: 34.2260, lng: 135.1675 },
  "鳥取県": { lat: 35.5036, lng: 134.2383 },
  "島根県": { lat: 35.4723, lng: 133.0505 },
  "岡山県": { lat: 34.6617, lng: 133.9344 },
  "広島県": { lat: 34.3963, lng: 132.4596 },
  "山口県": { lat: 34.1859, lng: 131.4705 },
  "徳島県": { lat: 34.0658, lng: 134.5593 },
  "香川県": { lat: 34.3401, lng: 134.0434 },
  "愛媛県": { lat: 33.8417, lng: 132.7657 },
  "高知県": { lat: 33.5597, lng: 133.5311 },
  "福岡県": { lat: 33.6064, lng: 130.4183 },
  "佐賀県": { lat: 33.2494, lng: 130.2988 },
  "長崎県": { lat: 32.7448, lng: 129.8737 },
  "熊本県": { lat: 32.7898, lng: 130.7417 },
  "大分県": { lat: 33.2382, lng: 131.6126 },
  "宮崎県": { lat: 31.9111, lng: 131.4239 },
  "鹿児島県": { lat: 31.5602, lng: 130.5581 },
  "沖縄県": { lat: 26.2124, lng: 127.6809 },
};

/**
 * Geocoding APIの結果から都道府県名を抽出する。
 * Google Maps Geocoding APIのaddress_componentsを走査し、
 * "administrative_area_level_1" タイプのlong_nameを返す。
 */
function extractPrefectureFromGeocode(
  results: google.maps.GeocoderResult[]
): string | null {
  for (const result of results) {
    for (const component of result.address_components) {
      if (component.types.includes("administrative_area_level_1")) {
        const longName = component.long_name;
        // PREFECTURES リストに完全一致するものを返す
        const matched = PREFECTURES.find((p) => p === longName);
        if (matched) return matched;
        // 「県」「都」「府」「道」を付けたバリエーションで再マッチ
        const withSuffix = PREFECTURES.find(
          (p) =>
            p.startsWith(longName) ||
            longName.startsWith(p.replace(/[都道府県]$/, ""))
        );
        if (withSuffix) return withSuffix;
      }
    }
  }
  return null;
}

interface PrefectureMapSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  defaultShowMap?: boolean;
}

export function PrefectureMapSelector({
  value,
  onChange,
  error,
  label = "都道府県",
  required = false,
  defaultShowMap = false,
}: PrefectureMapSelectorProps) {
  const [showMap, setShowMap] = useState(defaultShowMap);
  const [geocoding, setGeocoding] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  /** 指定都道府県の座標にマップを移動してマーカーを配置 */
  const moveToPrefecture = (map: google.maps.Map, prefecture: string) => {
    const coords = PREFECTURE_COORDS[prefecture];
    if (!coords) return;
    map.setCenter(coords);
    map.setZoom(9);
    if (markerRef.current) {
      markerRef.current.map = null;
    }
    markerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: coords,
      title: prefecture,
    });
  };

  /** 都道府県ドロップダウン変更時：マーカーを更新 */
  const handlePrefectureChange = (prefecture: string) => {
    onChange(prefecture);
    if (showMap && mapRef.current) {
      moveToPrefecture(mapRef.current, prefecture);
    }
  };

  /** マップ準備完了時：既存選択を反映 + クリックリスナー登録 */
  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();

    // 選択済みの都道府県があればマーカーを表示
    if (value && PREFECTURE_COORDS[value]) {
      moveToPrefecture(map, value);
    }

    // マップクリック → 逆ジオコーディング → 都道府県自動選択
    if (clickListenerRef.current) {
      clickListenerRef.current.remove();
    }
    clickListenerRef.current = map.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !geocoderRef.current) return;
        const latLng = e.latLng;

        // クリック位置に一時マーカーを配置
        if (markerRef.current) {
          markerRef.current.map = null;
        }
        markerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: latLng,
          title: "取得中...",
        });

        setGeocoding(true);
        geocoderRef.current.geocode(
          { location: latLng },
          (results, status) => {
            setGeocoding(false);
            if (
              status === google.maps.GeocoderStatus.OK &&
              results &&
              results.length > 0
            ) {
              const prefecture = extractPrefectureFromGeocode(results);
              if (prefecture) {
                onChange(prefecture);
                if (markerRef.current) {
                  markerRef.current.title = prefecture;
                }
              }
            }
          }
        );
      }
    );
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {/* 都道府県ドロップダウン */}
      <Select onValueChange={handlePrefectureChange} value={value}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="都道府県を選択" />
        </SelectTrigger>
        <SelectContent>
          {PREFECTURES.map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}

      {/* 地図で確認ボタン */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
        onClick={() => setShowMap(!showMap)}
      >
        <MapPin className="w-3.5 h-3.5" />
        {showMap ? "地図を閉じる" : "地図で位置を確認"}
        {showMap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </Button>

      {/* マップ表示エリア */}
      {showMap && (
        <div className="rounded-lg overflow-hidden border border-border mt-2">
          <div className="bg-muted/40 px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>
              {geocoding ? (
                <span className="text-primary font-medium">都道府県を取得中...</span>
              ) : value ? (
                <>
                  <strong className="text-foreground">{value}</strong>
                  が選択されています。地図をクリックすると自動で都道府県が変わります
                </>
              ) : (
                "都道府県を選択するか、地図をクリックして自動選択できます"
              )}
            </span>
          </div>
          <MapView
            className="h-[220px] sm:h-[280px]"
            initialCenter={value && PREFECTURE_COORDS[value] ? PREFECTURE_COORDS[value] : { lat: 36.2048, lng: 138.2529 }}
            initialZoom={value ? 9 : 5}
            onMapReady={handleMapReady}
          />
        </div>
      )}
    </div>
  );
}
