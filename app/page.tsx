"use client";

import { useState, useRef } from "react";

import useIP from "@/hooks/useIP";
import useUser from "@/hooks/useUser";
import useAddress from "@/hooks/useAddress";
import useHistory from "@/hooks/useHistory";
import useMail from "@/hooks/useMail";

import type { HistoryRecord, TempMailMessage } from "@/app/types";

import { Text, Flex, Box } from "@radix-ui/themes";
import { InboxDialog } from "./components/InboxDialog";
import { TopBar } from "./components/TopBar";
import { Toast } from "./components/Toast";
import { Header } from "./components/Header";
import { LeftCard } from "./components/LeftCard";
import { RightCard } from "./components/RightCard";

import { effect } from "@preact/signals-react";
import { addressService } from "@/services/addressService";

import { userSignal } from "@/signals/userSignal";
import { ipSignal } from "@/signals/ipSignal";
import { addressSignal, coordinatesSignal } from "@/signals/addressSignal";

export default function Home() {
  const {
    isLoading: addressLoading,
    error: addressError,
    addressRefetch: fetchAddress,
  } = useAddress(ipSignal.value);
  const { isLoading: ipLoading, error: ipError } = useIP();
  const [currentCountry, setCurrentCountry] = useState<string>("US");

  const {
    isLoading: userLoading,
    error: userError,
    refetch: fetchUser,
  } = useUser(currentCountry);

  const [inputIp, setInputIp] = useState<string>("");
  const [inputMode, setInputMode] = useState<string>("ip");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const {
    history,
    selectedHistory,
    setSelectedHistory,
    addHistoryRecord,
    deleteHistoryRecord,
    deleteAllHistory,
    toggleStarred,
  } = useHistory();
  const {
    tempEmail,
    emailLoading,
    messages,
    selectedMessage,
    toastMessage,
    setSelectedMessage,
    setToastMessage,
    handleMessageClick,
  } = useMail();
  const [inboxOpen, setInboxOpen] = useState(false);
  // 计算总的加载状态
  const isLoading =
    loading || emailLoading || addressLoading || ipLoading || userLoading;

  const hasAddedInitialHistory = useRef(false);

  // 国家名称到国家代码的映射表
  const countryNameToCode: Record<string, string> = {
    // 北美洲
    "United States": "US",
    "Canada": "CA",
    "Mexico": "MX",
    "Guatemala": "GT",
    "Honduras": "HN",
    "El Salvador": "SV",
    "Nicaragua": "NI",
    "Costa Rica": "CR",
    "Panama": "PA",
    "Cuba": "CU",
    "Haiti": "HT",
    "Dominican Republic": "DO",
    "Jamaica": "JM",
    "Trinidad and Tobago": "TT",
    "Bahamas": "BS",
    "Barbados": "BB",
    "Saint Lucia": "LC",
    "Grenada": "GD",
    "Saint Vincent and the Grenadines": "VC",
    "Antigua and Barbuda": "AG",
    "Dominica": "DM",
    "Saint Kitts and Nevis": "KN",
    "Belize": "BZ",
    "Aruba": "AW",
    "Curaçao": "CW",
    "Saint Martin": "MF",
    "Guadeloupe": "GP",
    "Martinique": "MQ",
    "Saint Barthélemy": "BL",
    "Anguilla": "AI",
    "Montserrat": "MS",
    "British Virgin Islands": "VG",
    "U.S. Virgin Islands": "VI",
    "Puerto Rico": "PR",
    "Turks and Caicos Islands": "TC",
    "Cayman Islands": "KY",
    "Bermuda": "BM",
    
    // 南美洲
    "Brazil": "BR",
    "Argentina": "AR",
    "Colombia": "CO",
    "Peru": "PE",
    "Venezuela": "VE",
    "Chile": "CL",
    "Ecuador": "EC",
    "Bolivia": "BO",
    "Paraguay": "PY",
    "Uruguay": "UY",
    "Guyana": "GY",
    "Suriname": "SR",
    "French Guiana": "GF",
    
    // 欧洲
    "United Kingdom": "GB",
    "Germany": "DE",
    "France": "FR",
    "Italy": "IT",
    "Spain": "ES",
    "Netherlands": "NL",
    "Switzerland": "CH",
    "Sweden": "SE",
    "Norway": "NO",
    "Denmark": "DK",
    "Finland": "FI",
    "Poland": "PL",
    "Portugal": "PT",
    "Greece": "GR",
    "Belgium": "BE",
    "Austria": "AT",
    "Ireland": "IE",
    "Russia": "RU",
    "Czech Republic": "CZ",
    "Hungary": "HU",
    "Romania": "RO",
    "Bulgaria": "BG",
    "Croatia": "HR",
    "Slovakia": "SK",
    "Slovenia": "SI",
    "Lithuania": "LT",
    "Latvia": "LV",
    "Estonia": "EE",
    "Luxembourg": "LU",
    "Malta": "MT",
    "Cyprus": "CY",
    "Iceland": "IS",
    "Monaco": "MC",
    "Andorra": "AD",
    "San Marino": "SM",
    "Vatican City": "VA",
    "Bosnia and Herzegovina": "BA",
    "Serbia": "RS",
    "Montenegro": "ME",
    "North Macedonia": "MK",
    "Albania": "AL",
    "Moldova": "MD",
    "Ukraine": "UA",
    "Belarus": "BY",
    "Kosovo": "XK",
    
    // 亚洲
    "Japan": "JP",
    "China": "CN",
    "India": "IN",
    "South Korea": "KR",
    "Indonesia": "ID",
    "Turkey": "TR",
    "Saudi Arabia": "SA",
    "United Arab Emirates": "AE",
    "Israel": "IL",
    "Pakistan": "PK",
    "Bangladesh": "BD",
    "Iran": "IR",
    "Iraq": "IQ",
    "Vietnam": "VN",
    "Philippines": "PH",
    "Thailand": "TH",
    "Malaysia": "MY",
    "Singapore": "SG",
    "Hong Kong": "HK",
    "Taiwan": "TW",
    "Kazakhstan": "KZ",
    "Afghanistan": "AF",
    "Yemen": "YE",
    "Syria": "SY",
    "Jordan": "JO",
    "Lebanon": "LB",
    "Palestine": "PS",
    "Kuwait": "KW",
    "Qatar": "QA",
    "Oman": "OM",
    "Bahrain": "BH",
    "Cambodia": "KH",
    "Laos": "LA",
    "Myanmar": "MM",
    "Nepal": "NP",
    "Bhutan": "BT",
    "Sri Lanka": "LK",
    "Maldives": "MV",
    "North Korea": "KP",
    "Mongolia": "MN",
    "Uzbekistan": "UZ",
    "Turkmenistan": "TM",
    "Tajikistan": "TJ",
    "Kyrgyzstan": "KG",
    "Georgia": "GE",
    "Armenia": "AM",
    "Azerbaijan": "AZ",
    "East Timor": "TL",
    "Brunei": "BN",
    
    // 非洲
    "Nigeria": "NG",
    "South Africa": "ZA",
    "Egypt": "EG",
    "Kenya": "KE",
    "Tanzania": "TZ",
    "Ghana": "GH",
    "Morocco": "MA",
    "Algeria": "DZ",
    "Tunisia": "TN",
    "Libya": "LY",
    "Sudan": "SD",
    "South Sudan": "SS",
    "Ethiopia": "ET",
    "Somalia": "SO",
    "Uganda": "UG",
    "Rwanda": "RW",
    "Burundi": "BI",
    "Congo": "CD",
    "Congo (Brazzaville)": "CG",
    "Zambia": "ZM",
    "Zimbabwe": "ZW",
    "Mozambique": "MZ",
    "Angola": "AO",
    "Namibia": "NA",
    "Botswana": "BW",
    "Lesotho": "LS",
    "Eswatini": "SZ",
    "Malawi": "MW",
    "Madagascar": "MG",
    "Mauritius": "MU",
    "Seychelles": "SC",
    "Comoros": "KM",
    "Reunion": "RE",
    "Mayotte": "YT",
    "Cote d'Ivoire": "CI",
    "Gambia": "GM",
    "Guinea": "GN",
    "Guinea-Bissau": "GW",
    "Liberia": "LR",
    "Sierra Leone": "SL",
    "Togo": "TG",
    "Benin": "BJ",
    "Niger": "NE",
    "Chad": "TD",
    "Central African Republic": "CF",
    "Cameroon": "CM",
    "Gabon": "GA",
    "Equatorial Guinea": "GQ",
    "São Tomé and Príncipe": "ST",
    "Cape Verde": "CV",
    "Senegal": "SN",
    "Mauritania": "MR",
    "Western Sahara": "EH",
    "Eritrea": "ER",
    "Djibouti": "DJ",
    "Burkina Faso": "BF",
    "Mali": "ML",
    
    // 大洋洲
    "Australia": "AU",
    "New Zealand": "NZ",
    "Papua New Guinea": "PG",
    "Fiji": "FJ",
    "Solomon Islands": "SB",
    "Vanuatu": "VU",
    "New Caledonia": "NC",
    "French Polynesia": "PF",
    "Samoa": "WS",
    "American Samoa": "AS",
    "Tokelau": "TK",
    "Tuvalu": "TV",
    "Kiribati": "KI",
    "Marshall Islands": "MH",
    "Palau": "PW",
    "Micronesia": "FM",
    "Guam": "GU",
    "Northern Mariana Islands": "MP",
    "Cook Islands": "CK",
    "Niue": "NU",
    "Tonga": "TO",
    "Wallis and Futuna": "WF",
    "Pitcairn Islands": "PN",
    "Nauru": "NR",
    "Norfolk Island": "NF",
    "Cocos (Keeling) Islands": "CC",
    "Christmas Island": "CX",
    "Lord Howe Island": "LH",
    "Macquarie Island": "MQ"
  };

  // 监听地址变化，更新国家并重新获取用户信息
  effect(() => {
    if (addressSignal.value?.country) {
      const countryCode = countryNameToCode[addressSignal.value.country] || "US";
      // 添加条件判断，只有当countryCode与当前currentCountry不同时才更新，避免无限循环
      if (countryCode !== currentCountry) {
        setCurrentCountry(countryCode);
      }
    }
  });

  // 使用 signal 的 effect 监听数据变化
  effect(() => {
    if (
      !hasAddedInitialHistory.current &&
      !ipLoading &&
      !userLoading &&
      !addressLoading &&
      ipSignal.value &&
      userSignal.value &&
      addressSignal.value
    ) {
      addHistoryRecord({
        user: userSignal.value,
        address: addressSignal.value,
        ip: ipSignal.value,
      });
      hasAddedInitialHistory.current = true;
    }
  });

  const handleGenerateAddress = async () => {
    setLoading(true);
    try {
      if (inputMode === "address") {
        if (!inputIp) {
          setError("请选择地址");
          return;
        }
        const [countryName, state, city] = inputIp.split("|");
        try {
          // 先设置当前国家，再获取用户信息
          const countryCode = countryNameToCode[countryName] || "US";
          setCurrentCountry(countryCode);
          const coordinates = await addressService.getCoordinates(
            countryName,
            state,
            city
          );
          coordinatesSignal.value = coordinates;
          await fetchAddress();
          // 移除直接调用fetchUser，因为effect会在currentCountry更新后自动处理
          if (userSignal.value && addressSignal.value && ipSignal.value) {
            addHistoryRecord({
              user: userSignal.value,
              address: addressSignal.value,
              ip: ipSignal.value,
            });
          }
        } catch (err) {
          setError("获取地址失败");
          console.error(err);
        }
        return;
      }

      // IP 模式下的处理
      const targetIp = inputIp || ipSignal.value;
      if (targetIp) {
        try {
          await fetchAddress();
          // 移除直接调用fetchUser，因为effect会在currentCountry更新后自动处理
          if (userSignal.value && addressSignal.value && ipSignal.value) {
            addHistoryRecord({
              user: userSignal.value,
              address: addressSignal.value,
              ip: ipSignal.value,
            });
          }
        } catch (err) {
          setError("获取地址失败");
          console.error(err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (record: HistoryRecord) => {
    setSelectedHistory(record.id);
    // 直接使用历史记录中的数据，不触发任何请求
    addressSignal.value = record.address;
    userSignal.value = record.user;
  };

  const handleToastClick = (message: TempMailMessage) => {
    setInboxOpen(true);
    setSelectedMessage(message);
  };

  return (
    <Box>
      <TopBar onInboxOpen={() => setInboxOpen(true)} />

      {/* 主要内容 */}
      <Flex
        className="min-h-screen"
        direction="column"
        align="center"
        justify="center"
        gap="4"
        style={{
          backgroundImage: "var(--background-image)",
          backgroundSize: "var(--background-size)",
          paddingTop: "60px", // 为固定导航栏留出空间
        }}
      >
        <Header ipLoading={ipLoading} ipError={ipError} ipSignal={ipSignal} />

        {userError && <Text color="red">获取用户信息失败</Text>}

        <Flex
          gap="4"
          style={{ width: "100%", maxWidth: "900px" }}
          className="flex flex-col md:flex-row"
        >
          {/* 左侧卡片 */}
          <LeftCard
            inputIp={inputIp}
            inputMode={inputMode}
            isLoading={isLoading}
            history={history}
            selectedHistory={selectedHistory}
            setInputIp={setInputIp}
            setInputMode={setInputMode}
            handleGenerateAddress={handleGenerateAddress}
            onHistoryClick={handleHistoryClick}
            onDeleteRecord={deleteHistoryRecord}
            onDeleteAll={deleteAllHistory}
            onToggleStarred={toggleStarred}
          />

          {/* 右侧卡片 */}
          <RightCard
            userSignal={userSignal}
            addressSignal={addressSignal}
            isLoading={isLoading}
            error={error}
            addressError={addressError}
            tempEmail={tempEmail}
          />
        </Flex>
        <InboxDialog
          open={inboxOpen}
          onOpenChange={setInboxOpen}
          email={tempEmail}
          messages={messages}
          onMessageClick={handleMessageClick}
          selectedMessage={selectedMessage}
        />
        {toastMessage && (
          <Toast
            message={toastMessage}
            onClose={() => setToastMessage(null)}
            onClick={() => handleToastClick(toastMessage)}
          />
        )}
      </Flex>
    </Box>
  );
}
