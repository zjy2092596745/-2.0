#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
智能PDF单词提取器 V2 - 改进版
自动从PDF词汇书中提取单词，并智能过滤无效内容
只保留有音标、中文释义的有效单词条目
"""

import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("正在安装必要的库 pdfplumber...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber", "openpyxl"])
    import pdfplumber

try:
    import openpyxl
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill
except ImportError:
    print("正在安装 openpyxl...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    from openpyxl import Workbook
    from openpyxl.styles import Font, Alignment, PatternFill


class WordEntry:
    """单词条目类"""
    def __init__(self):
        self.word = ""
        self.phonetic = ""
        self.definition = ""
        self.example_en = ""
        self.example_cn = ""

    def is_valid(self):
        """检查条目是否有效"""
        # 必须有单词
        if not self.word or len(self.word.strip()) == 0:
            return False

        # 单词必须主要是英文字母
        alpha_count = sum(c.isalpha() and ord(c) < 128 for c in self.word)
        if alpha_count < len(self.word) * 0.7:
            return False

        # 至少要有音标或中文释义之一
        has_phonetic = bool(self.phonetic and self.phonetic.strip())
        has_definition = bool(self.definition and self.definition.strip() and
                            re.search(r'[\u4e00-\u9fa5]', self.definition))

        if not (has_phonetic or has_definition):
            return False

        # 单词长度合理（1-30个字符）
        if len(self.word) < 1 or len(self.word) > 30:
            return False

        return True

    def __repr__(self):
        return f"Word({self.word}, {self.phonetic}, {self.definition[:20] if self.definition else 'N/A'})"


class PDFWordExtractor:
    """PDF单词提取器 - 改进版"""

    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.words = []
        self.invalid_count = 0

    def extract_text(self):
        """提取PDF文本"""
        print(f"正在读取PDF: {self.pdf_path}")
        all_text = []

        with pdfplumber.open(self.pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"PDF共有 {total_pages} 页")

            for i, page in enumerate(pdf.pages, 1):
                if i % 10 == 0:
                    print(f"处理进度: {i}/{total_pages} 页")

                text = page.extract_text()
                if text:
                    all_text.append(text)

        return '\n'.join(all_text)

    def parse_words(self, text):
        """智能解析单词 - 改进版"""
        print("\n正在智能解析单词...")
        print("应用智能过滤规则，只保留有效单词条目...")

        # 按段落分割（两个换行符）
        paragraphs = re.split(r'\n\s*\n', text)

        for para in paragraphs:
            if not para.strip():
                continue

            # 尝试解析这个段落
            entry = self._parse_paragraph(para)

            if entry and entry.is_valid():
                self.words.append(entry)
            else:
                self.invalid_count += 1

        print(f"成功提取 {len(self.words)} 个有效单词！")
        print(f"过滤掉 {self.invalid_count} 个无效条目")
        return self.words

    def _parse_paragraph(self, paragraph):
        """解析单个段落"""
        entry = WordEntry()
        lines = [l.strip() for l in paragraph.split('\n') if l.strip()]

        if len(lines) == 0:
            return None

        # 第一行通常是单词（可能带音标）
        first_line = lines[0]

        # 检测单词和音标
        # 模式: word /phonetic/ 或 word [phonetic]
        word_phonetic_pattern = r'^([a-zA-Z][\w\s\-\']+?)\s*[\[/]([^\]\/]+)[\]/]'
        match = re.match(word_phonetic_pattern, first_line)

        if match:
            entry.word = match.group(1).strip()
            entry.phonetic = '/' + match.group(2).strip() + '/'
        else:
            # 只有单词，没有音标
            word_only = re.match(r'^([a-zA-Z][\w\s\-\']+)', first_line)
            if word_only:
                entry.word = word_only.group(1).strip()

        if not entry.word:
            return None

        # 检查单词是否是常见的垃圾词
        if self._is_junk_word(entry.word):
            return None

        # 解析剩余行
        for i, line in enumerate(lines):
            if i == 0 and entry.word:  # 跳过已处理的第一行
                # 但检查第一行后面是否还有中文释义
                remaining = first_line[len(entry.word):].strip()
                if entry.phonetic:
                    remaining = remaining.replace(entry.phonetic, '').strip()
                if remaining and re.search(r'[\u4e00-\u9fa5]', remaining):
                    # 清理词性标记
                    cleaned = self._clean_definition(remaining)
                    if cleaned:
                        entry.definition = cleaned
                continue

            # 提取音标（如果还没有）
            if not entry.phonetic:
                phonetic = self._extract_phonetic(line)
                if phonetic:
                    entry.phonetic = phonetic
                    continue

            # 提取中文释义
            if not entry.definition and re.search(r'[\u4e00-\u9fa5]', line):
                # 确保不是例句（例句通常较长）
                if len(line) < 100 and not re.match(r'^[A-Z].*[.!?]$', line):
                    cleaned = self._clean_definition(line)
                    if cleaned:
                        entry.definition = cleaned
                        continue

            # 提取英文例句
            if not entry.ex_en and re.match(r'^[A-Z]', line):
                # 例句通常以大写字母开头，包含标点
                if re.search(r'[.!?]', line) and len(line) > 10:
                    entry.example_en = line
                    # 下一行可能是中文翻译
                    if i + 1 < len(lines) and re.search(r'[\u4e00-\u9fa5]', lines[i + 1]):
                        entry.example_cn = lines[i + 1]

        return entry

    def _is_junk_word(self, word):
        """判断是否是垃圾词（非单词）"""
        word_lower = word.lower().strip()

        # 排除模式
        junk_patterns = [
            r'^\d+$',  # 纯数字
            r'^page\s*\d+',  # 页码
            r'^unit\s*\d+',  # 单元
            r'^chapter\s*\d+',  # 章节
            r'^part\s+[ivxlcdm]+',  # 部分
            r'^word\s+list',  # Word List
            r'^test\s*\d*$',  # Test
            r'^exercise',  # Exercise
            r'^review',  # Review
            r'^notes?$',  # Notes
            r'^vocabulary',  # Vocabulary
            r'^\w{1}$',  # 单字母
        ]

        for pattern in junk_patterns:
            if re.match(pattern, word_lower):
                return True

        # 太短或太长
        if len(word) < 2 or len(word) > 30:
            return True

        # 包含太多非字母字符
        non_alpha = sum(not c.isalpha() and c != ' ' and c != '-' and c != '\'' for c in word)
        if non_alpha > len(word) * 0.3:
            return True

        return False

    def _clean_definition(self, text):
        """清理释义文本"""
        # 移除词性标记（n. v. adj. 等）
        cleaned = re.sub(r'^[a-z]{1,4}\.?\s+', '', text)

        # 移除多余的符号
        cleaned = re.sub(r'^[；;。，,、]\s*', '', cleaned)

        # 确保包含中文
        if not re.search(r'[\u4e00-\u9fa5]', cleaned):
            return ""

        return cleaned.strip()

    def _extract_phonetic(self, text):
        """提取音标"""
        patterns = [
            r'/([^/]+)/',
            r'\[([^\]]+)\]',
            r'【([^】]+)】',
        ]

        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                phonetic = match.group(1).strip()
                # 验证是否像音标（包含特殊音标字符）
                if any(c in phonetic for c in 'əɪʊɑɔæʌɜːˈˌθðŋʃʒ'):
                    return '/' + phonetic + '/'
        return ""

    def export_to_excel(self, output_path):
        """导出为Excel - 适配萁萁的单词本格式"""
        print(f"\n正在导出到Excel: {output_path}")

        wb = Workbook()
        ws = wb.active
        ws.title = "单词表"

        # 表头 - 使用应用支持的字段名
        headers = ['单词', '音标', '释义', '英文例句', '中文例句', '分类']
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.font = Font(bold=True, size=12, color="FFFFFF")
            cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
            cell.alignment = Alignment(horizontal='center', vertical='center')

        # 写入数据
        for row_idx, word_entry in enumerate(self.words, 2):
            ws.cell(row=row_idx, column=1, value=word_entry.word)
            ws.cell(row=row_idx, column=2, value=word_entry.phonetic)
            ws.cell(row=row_idx, column=3, value=word_entry.definition)
            ws.cell(row=row_idx, column=4, value=word_entry.example_en)
            ws.cell(row=row_idx, column=5, value=word_entry.example_cn)
            ws.cell(row=row_idx, column=6, value='导入单词')  # 默认分类

            # 设置对齐和自动换行
            for col in range(1, 7):
                cell = ws.cell(row=row_idx, column=col)
                cell.alignment = Alignment(vertical='top', wrap_text=True)

        # 调整列宽
        ws.column_dimensions['A'].width = 20  # 单词
        ws.column_dimensions['B'].width = 25  # 音标
        ws.column_dimensions['C'].width = 40  # 释义
        ws.column_dimensions['D'].width = 50  # 英文例句
        ws.column_dimensions['E'].width = 50  # 中文例句
        ws.column_dimensions['F'].width = 15  # 分类

        wb.save(output_path)
        print(f"✅ 导出成功！文件保存在: {output_path}")
        print(f"共导出 {len(self.words)} 个有效单词")
        print(f"\n可以直接在【萁萁的随身单词本】中导入这个Excel文件！")


def main():
    print("=" * 60)
    print("📚 智能PDF单词提取器 V2 - 改进版")
    print("=" * 60)
    print("✨ 新增功能：")
    print("  • 智能过滤无效内容")
    print("  • 只保留有音标或中文释义的有效单词")
    print("  • 自动适配【萁萁的随身单词本】格式")
    print("=" * 60)
    print()

    # 获取PDF文件路径
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1]
    else:
        pdf_path = input("请输入PDF文件路径（拖拽文件到这里也可以）: ").strip().strip('"')

    if not Path(pdf_path).exists():
        print(f"❌ 错误：找不到文件 {pdf_path}")
        input("按回车键退出...")
        return

    # 创建提取器
    extractor = PDFWordExtractor(pdf_path)

    # 提取文本
    text = extractor.extract_text()

    # 解析单词
    words = extractor.parse_words(text)

    if not words:
        print("❌ 没有提取到任何有效单词")
        print("提示：确保PDF包含单词、音标、中文释义等内容")
        input("按回车键退出...")
        return

    # 显示示例
    print("\n" + "=" * 60)
    print("📝 提取结果预览（前10个有效单词）:")
    print("=" * 60)
    for i, word in enumerate(words[:10], 1):
        print(f"\n{i}. 单词: {word.word}")
        if word.phonetic:
            print(f"   音标: {word.phonetic}")
        if word.definition:
            print(f"   释义: {word.definition}")
        if word.example_en:
            print(f"   例句: {word.example_en[:50]}...")

    # 生成输出文件名
    pdf_name = Path(pdf_path).stem
    output_dir = Path(pdf_path).parent
    excel_path = output_dir / f"{pdf_name}_单词表_优化版.xlsx"

    # 导出为Excel
    extractor.export_to_excel(excel_path)

    print("\n" + "=" * 60)
    print("🎉 完成！")
    print("=" * 60)
    print("\n📍 使用方法：")
    print("1. 打开【萁萁的随身单词本】应用")
    print("2. 点击【我的词库】→ 右上角上传按钮")
    print("3. 选择刚生成的Excel文件")
    print("4. 确认导入即可！")
    input("\n按回车键退出...")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        input("\n按回车键退出...")
