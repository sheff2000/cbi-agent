// =============================
// File: config/utils/xmlLoader.js
// =============================

import fs from 'fs/promises';
import { XMLParser } from 'fast-xml-parser';

// Универсальный загрузчик XML конфигураций.
// Возвращает объект JS с ключами и значениями из XML.
// Если файл отсутствует — выбрасывает исключение.

export async function loadXmlConfig(name) {
  const path = `./config/xml/${name}.xml`;
  try {
    const xmlText = await fs.readFile(path, 'utf-8');
    const parser = new XMLParser({ ignoreAttributes: false });
    const data = parser.parse(xmlText);

    // допустим, формат:
    // <connect>
    //   <SERVER_URL>wss://main.server/</SERVER_URL>
    //   <USE_SSL>true</USE_SSL>
    // </connect>
    //
    // тогда получаем data.connect.{...}
    const root = Object.keys(data)[0];
    return data[root] || {};
  } catch (err) {
    throw new Error(`Ошибка загрузки XML ${name}: ${err.message}`);
  }
}
