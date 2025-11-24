import { Word } from '../types';
import * as XLSX from 'xlsx';

/**
 * 智能文档解析服务
 * 自动识别Word、Excel、PDF等格式中的单词、音标、释义、例句等内容
 */

interface ParsedContent {
  word?: string;
  ipa?: string;
  def?: string;
  ex_en?: string;
  ex_cn?: string;
  category?: string;
}

/**
 * 解析原始文本，智能识别单词条目
 */
export class DocumentParserService {

  /**
   * 从文件中提取并解析内容
   */
  static async parseFile(file: File, defaultCategory: string = "导入单词"): Promise<Word[]> {
    const fileType = this.getFileType(file.name);

    let rawText = '';

    switch (fileType) {
      case 'docx':
        rawText = await this.parseDocx(file);
        break;
      case 'pdf':
        rawText = await this.parsePdf(file);
        break;
      case 'xlsx':
      case 'xls':
        return await this.parseExcel(file, defaultCategory);
      case 'json':
        return await this.parseJson(file, defaultCategory);
      case 'txt':
        rawText = await this.parseText(file);
        break;
      default:
        throw new Error(`不支持的文件格式: ${file.name}`);
    }

    // 智能解析文本内容
    return this.intelligentParse(rawText, defaultCategory);
  }

  /**
   * 获取文件类型
   */
  private static getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext || '';
  }

  /**
   * 解析Word文档 (.docx)
   */
  private static async parseDocx(file: File): Promise<string> {
    try {
      // 动态导入mammoth
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('解析Word文档失败:', error);
      throw new Error('解析Word文档失败，请确保文件格式正确');
    }
  }

  /**
   * 解析PDF文档
   */
  private static async parsePdf(file: File): Promise<string> {
    try {
      // 动态导入pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist');

      // 设置worker路径
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      // 遍历所有页面
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('解析PDF失败:', error);
      throw new Error('解析PDF失败，请确保文件格式正确');
    }
  }

  /**
   * 解析Excel文档
   */
  private static async parseExcel(file: File, defaultCategory: string): Promise<Word[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet);

          // 智能识别Excel列
          const normalized = this.parseExcelData(jsonData, defaultCategory);
          resolve(normalized);
        } catch (err) {
          reject(err);
        }
      };

      reader.readAsBinaryString(file);
    });
  }

  /**
   * 解析JSON文件
   */
  private static async parseJson(file: File, defaultCategory: string): Promise<Word[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          let jsonData = JSON.parse(data);
          if (!Array.isArray(jsonData)) {
            jsonData = [jsonData];
          }

          const normalized = jsonData.map((item: any) => this.normalizeWordEntry(item, defaultCategory))
            .filter((w): w is Word => w !== null);

          resolve(normalized);
        } catch (err) {
          reject(err);
        }
      };

      reader.readAsText(file);
    });
  }

  /**
   * 解析纯文本文件
   */
  private static async parseText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * 智能解析Excel数据
   */
  private static parseExcelData(data: any[], defaultCategory: string): Word[] {
    return data.map(item => this.normalizeWordEntry(item, defaultCategory))
      .filter((w): w is Word => w !== null);
  }

  /**
   * 标准化单词条目 - 自动识别各种可能的字段名
   */
  private static normalizeWordEntry(item: any, defaultCategory: string): Word | null {
    // 智能识别单词字段
    const word = this.findField(item, [
      'word', 'Word', 'WORD', '单词', 'term', 'Term', '英文', 'english', 'English'
    ]);

    // 智能识别释义字段
    const def = this.findField(item, [
      'definition', 'Definition', 'def', 'meaning', 'Meaning',
      '释义', '中文', '翻译', '含义', 'chinese', 'Chinese', 'translation'
    ]);

    if (!word || !def) {
      return null;
    }

    // 智能识别音标
    const ipa = this.findField(item, [
      'ipa', 'IPA', 'phonetic', 'Phonetic', '音标', 'pronunciation', 'Pronunciation'
    ]) || '';

    // 智能识别英文例句
    const ex_en = this.findField(item, [
      'example', 'Example', 'example_en', 'exampleEn', 'sentence',
      '例句', 'exampleSentence', 'sentenceEn', '英文例句'
    ]) || '';

    // 智能识别中文例句
    const ex_cn = this.findField(item, [
      'example_cn', 'exampleCn', 'translation', 'Translation',
      '例句翻译', '中文例句', 'sentenceCn', 'exampleTranslation'
    ]) || '';

    // 智能识别分类
    const category = this.findField(item, [
      'category', 'Category', '分类', 'book', 'Book', '书名', 'type', 'Type'
    ]) || defaultCategory;

    return {
      id: Date.now() + Math.random(),
      word: String(word).trim(),
      ipa: String(ipa).trim(),
      def: String(def).trim(),
      ex_en: String(ex_en).trim(),
      ex_cn: String(ex_cn).trim(),
      category: String(category).trim(),
      srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 }
    };
  }

  /**
   * 从对象中查找字段（支持多个可能的字段名）
   */
  private static findField(obj: any, possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      if (obj.hasOwnProperty(name) && obj[name]) {
        return obj[name];
      }
    }
    return undefined;
  }

  /**
   * 智能解析文本内容，自动识别单词条目
   * 支持多种格式：
   * 1. 单词 /音标/ 释义
   * 2. 单词\n音标\n释义\n例句
   * 3. 单词：释义
   * 4. 等等...
   */
  private static intelligentParse(text: string, defaultCategory: string): Word[] {
    const words: Word[] = [];

    // 按段落分割
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

    for (const paragraph of paragraphs) {
      const parsed = this.parseEntry(paragraph);
      if (parsed && parsed.word && parsed.def) {
        words.push({
          id: Date.now() + Math.random(),
          word: parsed.word,
          ipa: parsed.ipa || '',
          def: parsed.def,
          ex_en: parsed.ex_en || '',
          ex_cn: parsed.ex_cn || '',
          category: parsed.category || defaultCategory,
          srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 }
        });
      }
    }

    // 如果按段落解析失败，尝试按行解析
    if (words.length === 0) {
      const lines = text.split('\n').filter(l => l.trim());
      return this.parseLineByLine(lines, defaultCategory);
    }

    return words;
  }

  /**
   * 解析单个条目（段落）
   */
  private static parseEntry(entry: string): ParsedContent | null {
    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length === 0) return null;

    const result: ParsedContent = {};

    // 尝试从第一行提取单词和音标
    const firstLine = lines[0];
    const wordIpaMatch = firstLine.match(/^([a-zA-Z\s\-']+)\s*[/\[【]([^\]/\]】]+)[/\]】]/);

    if (wordIpaMatch) {
      result.word = wordIpaMatch[1].trim();
      result.ipa = `/${wordIpaMatch[2].trim()}/`;
    } else {
      // 尝试提取纯单词
      const wordMatch = firstLine.match(/^([a-zA-Z\s\-']+)[\s:：]/);
      if (wordMatch) {
        result.word = wordMatch[1].trim();
      } else {
        // 整个第一行可能就是单词
        const pureWord = firstLine.match(/^[a-zA-Z\s\-']+$/);
        if (pureWord) {
          result.word = pureWord[0].trim();
        }
      }
    }

    // 从剩余行中查找各种信息
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 识别音标（如果还没找到）
      if (!result.ipa) {
        const ipaMatch = line.match(/[/\[【]([^\]/\]】]+)[/\]】]/);
        if (ipaMatch) {
          result.ipa = `/${ipaMatch[1].trim()}/`;
          continue;
        }
      }

      // 识别中文释义（包含中文字符的行）
      if (!result.def && /[\u4e00-\u9fa5]/.test(line)) {
        // 检查是否是例句（通常例句比较长，且可能包含标点）
        const hasEnglish = /[a-zA-Z]/.test(line);
        const isLong = line.length > 20;

        if (!hasEnglish || !isLong) {
          // 可能是释义
          result.def = line.replace(/^[释义定义意思：:]\s*/, '').trim();
          continue;
        }
      }

      // 识别英文例句
      if (!result.ex_en && /^[A-Z].*[.!?]$/.test(line) && !result.def) {
        result.ex_en = line;
        // 下一行可能是中文翻译
        if (i + 1 < lines.length && /[\u4e00-\u9fa5]/.test(lines[i + 1])) {
          result.ex_cn = lines[i + 1];
        }
        continue;
      }
    }

    // 如果第一行包含冒号，可能是 "单词: 释义" 格式
    if (!result.def && firstLine.includes(':') || firstLine.includes('：')) {
      const parts = firstLine.split(/[：:]/);
      if (parts.length >= 2) {
        if (!result.word) {
          result.word = parts[0].trim();
        }
        const defPart = parts.slice(1).join(':').trim();
        if (/[\u4e00-\u9fa5]/.test(defPart)) {
          result.def = defPart;
        }
      }
    }

    return result.word ? result : null;
  }

  /**
   * 逐行解析（当段落解析失败时使用）
   */
  private static parseLineByLine(lines: string[], defaultCategory: string): Word[] {
    const words: Word[] = [];
    let currentWord: ParsedContent = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line) continue;

      // 检查是否是新单词（以英文字母开头）
      if (/^[A-Z][a-z]/.test(line) && !currentWord.word) {
        // 可能是新单词
        const wordMatch = line.match(/^([a-zA-Z\s\-']+)/);
        if (wordMatch) {
          currentWord.word = wordMatch[1].trim();

          // 检查同一行是否有音标和释义
          const ipaMatch = line.match(/[/\[【]([^\]/\]】]+)[/\]】]/);
          if (ipaMatch) {
            currentWord.ipa = `/${ipaMatch[1].trim()}/`;
          }

          // 检查是否有中文释义
          const afterWord = line.substring(wordMatch[0].length);
          if (/[\u4e00-\u9fa5]/.test(afterWord)) {
            currentWord.def = afterWord.replace(/^[/\[【]([^\]/\]】]+)[/\]】]\s*/, '').trim();
          }
        }
      } else if (currentWord.word) {
        // 已经有单词，继续解析其他信息

        // 音标
        if (!currentWord.ipa && /[/\[【]/.test(line)) {
          const ipaMatch = line.match(/[/\[【]([^\]/\]】]+)[/\]】]/);
          if (ipaMatch) {
            currentWord.ipa = `/${ipaMatch[1].trim()}/`;
          }
        }

        // 中文释义
        if (!currentWord.def && /[\u4e00-\u9fa5]/.test(line)) {
          currentWord.def = line;
        }

        // 检查是否到了下一个单词
        if (/^[A-Z][a-z]/.test(line) && currentWord.def) {
          // 保存当前单词
          if (currentWord.word && currentWord.def) {
            words.push({
              id: Date.now() + Math.random(),
              word: currentWord.word,
              ipa: currentWord.ipa || '',
              def: currentWord.def,
              ex_en: currentWord.ex_en || '',
              ex_cn: currentWord.ex_cn || '',
              category: currentWord.category || defaultCategory,
              srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 }
            });
          }

          // 开始新单词
          currentWord = {};
          i--; // 重新处理这一行
        }
      }
    }

    // 保存最后一个单词
    if (currentWord.word && currentWord.def) {
      words.push({
        id: Date.now() + Math.random(),
        word: currentWord.word,
        ipa: currentWord.ipa || '',
        def: currentWord.def,
        ex_en: currentWord.ex_en || '',
        ex_cn: currentWord.ex_cn || '',
        category: currentWord.category || defaultCategory,
        srs: { interval: 0, reps: 0, ease: 2.5, nextReview: 0 }
      });
    }

    return words;
  }
}
