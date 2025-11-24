#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Excel单词表清理器
读取第一版脚本生成的Excel，智能过滤掉无效内容
"""

import re
import sys
from pathlib import Path

try:
    import openpyxl
    from openpyxl import Workbook, load_workbook
    from openpyxl.styles import Font, Alignment, PatternFill
except ImportError:
    print("正在安装 openpyxl...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    from openpyxl import Workbook, load_workbook
    from openpyxl.styles import Font, Alignment, PatternFill


class ExcelWordCleaner:
    """Excel单词表清理器"""

    def __init__(self, excel_path):
        self.excel_path = excel_path
        self.valid_words = []
        self.invalid_count = 0

    def clean(self):
        """清理Excel文件"""
        print(f"正在读取Excel: {self.excel_path}")

        wb = load_workbook(self.excel_path)
        ws = wb.active

        total_rows = ws.max_row
        print(f"Excel共有 {total_rows - 1} 行数据（不含表头）")

        # 读取表头
        headers = [cell.value for cell in ws[1]]
        print(f"检测到的列: {headers}")

        # 找到关键列的索引
        word_col = self._find_column(headers, ['单词', 'word', 'Word'])
        ipa_col = self._find_column(headers, ['音标', 'ipa', 'IPA', 'phonetic'])
        def_col = self._find_column(headers, ['释义', 'definition', 'def', '中文'])
        ex_en_col = self._find_column(headers, ['英文例句', 'example', 'example_en', '例句'])
        ex_cn_col = self._find_column(headers, ['中文例句', 'example_cn', '例句翻译'])

        print(f"\n找到的列索引: 单词={word_col}, 音标={ipa_col}, 释义={def_col}")
        print("开始清理数据...")

        # 遍历所有行
        for row_idx in range(2, total_rows + 1):
            if row_idx % 100 == 0:
                print(f"处理进度: {row_idx - 1}/{total_rows - 1} 行")

            # 读取数据
            word = self._get_cell_value(ws, row_idx, word_col)
            ipa = self._get_cell_value(ws, row_idx, ipa_col)
            definition = self._get_cell_value(ws, row_idx, def_col)
            ex_en = self._get_cell_value(ws, row_idx, ex_en_col)
            ex_cn = self._get_cell_value(ws, row_idx, ex_cn_col)

            # 验证并清理
            if self._is_valid_entry(word, ipa, definition):
                self.valid_words.append({
                    'word': word.strip() if word else '',
                    'ipa': ipa.strip() if ipa else '',
                    'definition': definition.strip() if definition else '',
                    'ex_en': ex_en.strip() if ex_en else '',
                    'ex_cn': ex_cn.strip() if ex_cn else '',
                })
            else:
                self.invalid_count += 1

        print(f"\n✅ 清理完成！")
        print(f"有效单词: {len(self.valid_words)} 个")
        print(f"过滤掉: {self.invalid_count} 个无效条目")

        return self.valid_words

    def _find_column(self, headers, possible_names):
        """查找列索引"""
        for i, header in enumerate(headers):
            if header and any(name in str(header) for name in possible_names):
                return i
        return None

    def _get_cell_value(self, ws, row, col):
        """获取单元格值"""
        if col is None:
            return ""
        cell = ws.cell(row=row, column=col + 1)
        return str(cell.value) if cell.value else ""

    def _is_valid_entry(self, word, ipa, definition):
        """验证条目是否有效"""
        # 必须有单词
        if not word or len(word.strip()) == 0:
            return False

        word = word.strip()

        # 过滤垃圾词
        if self._is_junk_word(word):
            return False

        # 单词长度合理
        if len(word) < 2 or len(word) > 30:
            return False

        # 单词必须主要是英文字母
        alpha_count = sum(c.isalpha() and ord(c) < 128 for c in word)
        if alpha_count < len(word) * 0.6:
            return False

        # 至少要有音标或中文释义之一
        has_ipa = bool(ipa and ipa.strip() and ('/' in ipa or '[' in ipa))
        has_def = bool(definition and definition.strip() and
                      re.search(r'[\u4e00-\u9fa5]', definition))

        if not (has_ipa or has_def):
            return False

        # 如果有释义，检查是否太长（可能是段落文本）
        if has_def and len(definition) > 200:
            return False

        return True

    def _is_junk_word(self, word):
        """判断是否是垃圾词"""
        word_lower = word.lower().strip()

        # 垃圾词列表
        junk_words = [
            'word list', 'test', 'exercise', 'review', 'notes', 'note',
            'vocabulary', 'chapter', 'unit', 'part', 'section', 'page',
            'traditional', 'house of this part of', 'ireland', 'lack',
            'england', 'mp', 'tord', 'soco', 'point', 'tract', 'cess',
            'bat', 'emperor', 'regent', 'burgeon', 'argue', 'professionals has',
            'emerged', 'arise', 'for', 'aids', 'barely', 'at',
        ]

        if word_lower in junk_words:
            return True

        # 垃圾模式
        junk_patterns = [
            r'^\d+$',  # 纯数字
            r'^page\s*\d+',
            r'^unit\s*\d+',
            r'^chapter\s*\d+',
            r'^part\s+[ivxlcdm]+',
            r'^\w{1}$',  # 单字母
            r'^[a-z]{1,2}$',  # 1-2个字母
        ]

        for pattern in junk_patterns:
            if re.match(pattern, word_lower):
                return True

        return False

    def export_to_excel(self, output_path):
        """导出清理后的Excel"""
        print(f"\n正在导出清理后的Excel: {output_path}")

        wb = Workbook()
        ws = wb.active
        ws.title = "单词表"

        # 表头
        headers = ['单词', '音标', '释义', '英文例句', '中文例句', '分类']
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.font = Font(bold=True, size=12, color="FFFFFF")
            cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
            cell.alignment = Alignment(horizontal='center', vertical='center')

        # 写入数据
        for row_idx, word_data in enumerate(self.valid_words, 2):
            ws.cell(row=row_idx, column=1, value=word_data['word'])
            ws.cell(row=row_idx, column=2, value=word_data['ipa'])
            ws.cell(row=row_idx, column=3, value=word_data['definition'])
            ws.cell(row=row_idx, column=4, value=word_data['ex_en'])
            ws.cell(row=row_idx, column=5, value=word_data['ex_cn'])
            ws.cell(row=row_idx, column=6, value='导入单词')

            # 设置对齐
            for col in range(1, 7):
                cell = ws.cell(row=row_idx, column=col)
                cell.alignment = Alignment(vertical='top', wrap_text=True)

        # 调整列宽
        ws.column_dimensions['A'].width = 20
        ws.column_dimensions['B'].width = 25
        ws.column_dimensions['C'].width = 40
        ws.column_dimensions['D'].width = 50
        ws.column_dimensions['E'].width = 50
        ws.column_dimensions['F'].width = 15

        wb.save(output_path)
        print(f"✅ 导出成功！")
        print(f"文件保存在: {output_path}")
        print(f"共 {len(self.valid_words)} 个有效单词")


def main():
    print("=" * 60)
    print("📊 Excel单词表清理器")
    print("=" * 60)
    print("功能：清理第一版脚本生成的Excel，过滤无效内容")
    print("=" * 60)
    print()

    # 获取Excel文件路径
    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
    else:
        excel_path = input("请输入Excel文件路径（拖拽文件到这里也可以）: ").strip().strip('"')

    if not Path(excel_path).exists():
        print(f"❌ 错误：找不到文件 {excel_path}")
        input("按回车键退出...")
        return

    if not excel_path.endswith(('.xlsx', '.xls')):
        print(f"❌ 错误：请提供Excel文件（.xlsx 或 .xls）")
        input("按回车键退出...")
        return

    # 创建清理器
    cleaner = ExcelWordCleaner(excel_path)

    # 清理数据
    valid_words = cleaner.clean()

    if not valid_words:
        print("\n❌ 没有找到任何有效单词！")
        print("请检查Excel文件格式，确保包含：")
        print("  - 单词列")
        print("  - 音标或中文释义列")
        input("\n按回车键退出...")
        return

    # 显示预览
    print("\n" + "=" * 60)
    print("📝 清理结果预览（前10个有效单词）:")
    print("=" * 60)
    for i, word_data in enumerate(valid_words[:10], 1):
        print(f"\n{i}. 单词: {word_data['word']}")
        if word_data['ipa']:
            print(f"   音标: {word_data['ipa']}")
        if word_data['definition']:
            print(f"   释义: {word_data['definition'][:60]}...")

    # 生成输出文件名
    input_path = Path(excel_path)
    output_path = input_path.parent / f"{input_path.stem}_清理版.xlsx"

    # 导出
    cleaner.export_to_excel(output_path)

    print("\n" + "=" * 60)
    print("🎉 完成！")
    print("=" * 60)
    print("\n📍 使用方法：")
    print("在【萁萁的随身单词本】中导入清理后的Excel文件即可！")
    input("\n按回车键退出...")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")
        import traceback
        traceback.print_exc()
        input("\n按回车键退出...")
