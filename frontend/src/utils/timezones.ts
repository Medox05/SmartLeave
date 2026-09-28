export interface TimezoneOption {
  value: string;
  label: string;
}

export const timezoneOptions: TimezoneOption[] = [
  // UTC-12 to UTC-09
  { value: 'Pacific/Kwajalein', label: '(UTC-12:00) International Date Line West (Kwajalein)' },
  { value: 'Pacific/Midway', label: '(UTC-11:00) Midway Island, Samoa' },
  { value: 'Pacific/Honolulu', label: '(UTC-10:00) Hawaii' },
  { value: 'America/Anchorage', label: '(UTC-09:00) Alaska' },

  // UTC-08 to UTC-05 (North & South America)
  { value: 'America/Los_Angeles', label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { value: 'America/Tijuana', label: '(UTC-08:00) Tijuana, Baja California' },
  { value: 'America/Denver', label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { value: 'America/Phoenix', label: '(UTC-07:00) Arizona' },
  { value: 'America/Chicago', label: '(UTC-06:00) Central Time (US & Canada)' },
  { value: 'America/Mexico_City', label: '(UTC-06:00) Mexico City' },
  { value: 'America/Bogota', label: '(UTC-05:00) Bogota, Lima, Quito' },
  { value: 'America/New_York', label: '(UTC-05:00) Eastern Time (US & Canada)' },

  // UTC-04 to UTC-01
  { value: 'America/Caracas', label: '(UTC-04:00) Caracas' },
  { value: 'America/Santiago', label: '(UTC-04:00) Santiago' },
  { value: 'America/Halifax', label: '(UTC-04:00) Atlantic Time (Canada)' },
  { value: 'America/St_Johns', label: '(UTC-03:30) Newfoundland' },
  { value: 'America/Argentina/Buenos_Aires', label: '(UTC-03:00) Buenos Aires' },
  { value: 'America/Sao_Paulo', label: '(UTC-03:00) Brasilia' },
  { value: 'Atlantic/South_Georgia', label: '(UTC-02:00) Mid-Atlantic' },
  { value: 'Atlantic/Azores', label: '(UTC-01:00) Azores' },
  { value: 'Atlantic/Cape_Verde', label: '(UTC-01:00) Cape Verde Is.' },

  // UTC+00:00 (GMT / UTC / London / WET)
  { value: 'UTC', label: '(UTC+00:00) Coordinated Universal Time (UTC)' },
  { value: 'Europe/London', label: '(UTC+00:00) Dublin, Edinburgh, Lisbon, London' },
  { value: 'Africa/Monrovia', label: '(UTC+00:00) Monrovia, Reykjavik' },

  // UTC+01:00 (CET / WAT)
  { value: 'Europe/Paris', label: '(UTC+01:00) Paris, Amsterdam, Berlin, Rome, Madrid' },
  { value: 'Africa/Casablanca', label: '(UTC+01:00) Casablanca' },
  { value: 'Africa/Lagos', label: '(UTC+01:00) West Central Africa (Lagos)' },

  // UTC+02:00 (EET / CAT / SAST)
  { value: 'Europe/Athens', label: '(UTC+02:00) Athens, Bucharest, Istanbul' },
  { value: 'Europe/Helsinki', label: '(UTC+02:00) Helsinki, Kyiv, Riga, Vilnius' },
  { value: 'Africa/Cairo', label: '(UTC+02:00) Cairo' },
  { value: 'Africa/Johannesburg', label: '(UTC+02:00) Harare, Pretoria, Johannesburg' },

  // UTC+03:00 to UTC+04:30 (Arabia / Moscow / Iran)
  { value: 'Asia/Riyadh', label: '(UTC+03:00) Kuwait, Riyadh, Baghdad, Doha' },
  { value: 'Europe/Moscow', label: '(UTC+03:00) Moscow, St. Petersburg' },
  { value: 'Africa/Nairobi', label: '(UTC+03:00) Nairobi' },
  { value: 'Asia/Tehran', label: '(UTC+03:30) Tehran' },
  { value: 'Asia/Dubai', label: '(UTC+04:00) Abu Dhabi, Muscat, Dubai' },
  { value: 'Asia/Baku', label: '(UTC+04:00) Baku, Tbilisi, Yerevan' },
  { value: 'Asia/Kabul', label: '(UTC+04:30) Kabul' },

  // UTC+05:00 to UTC+06:30 (South Asia / Central Asia)
  { value: 'Asia/Karachi', label: '(UTC+05:00) Islamabad, Karachi, Tashkent' },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { value: 'Asia/Kathmandu', label: '(UTC+05:45) Kathmandu' },
  { value: 'Asia/Dhaka', label: '(UTC+06:00) Astana, Dhaka' },
  { value: 'Asia/Yangon', label: '(UTC+06:30) Yangon (Rangoon)' },

  // UTC+07:00 to UTC+09:30 (East Asia / Southeast Asia / WA)
  { value: 'Asia/Bangkok', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
  { value: 'Asia/Shanghai', label: '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi' },
  { value: 'Asia/Singapore', label: '(UTC+08:00) Kuala Lumpur, Singapore' },
  { value: 'Asia/Taipei', label: '(UTC+08:00) Taipei' },
  { value: 'Australia/Perth', label: '(UTC+08:00) Perth' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Osaka, Sapporo, Tokyo' },
  { value: 'Asia/Seoul', label: '(UTC+09:00) Seoul' },
  { value: 'Australia/Darwin', label: '(UTC+09:30) Darwin' },

  // UTC+10:00 to UTC+14:00 (Australia East / Pacific)
  { value: 'Australia/Sydney', label: '(UTC+10:00) Canberra, Melbourne, Sydney' },
  { value: 'Australia/Brisbane', label: '(UTC+10:00) Brisbane' },
  { value: 'Pacific/Port_Moresby', label: '(UTC+10:00) Guam, Port Moresby' },
  { value: 'Pacific/Guadalcanal', label: '(UTC+11:00) Magadan, Solomon Is., New Caledonia' },
  { value: 'Pacific/Auckland', label: '(UTC+12:00) Auckland, Wellington' },
  { value: 'Pacific/Fiji', label: '(UTC+12:00) Fiji, Kamchatka, Marshall Is.' },
  { value: 'Pacific/Tongatapu', label: "(UTC+13:00) Nuku'alofa" },
  { value: 'Pacific/Kiritimati', label: '(UTC+14:00) Kiritimati (Line Islands)' },
];
