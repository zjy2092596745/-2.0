# 文档格式智能识别功能说明

## 功能概述

新增的智能文档解析功能可以自动识别多种文档格式中的单词、音标、释义、例句等内容，无需预先按照固定格式排列。

## 支持的文档格式

### 1. Word文档 (.docx)
- 自动提取文本内容
- 智能识别单词条目结构

### 2. Excel文件 (.xlsx, .xls)
- 智能识别列名，支持多种命名方式
- 自动匹配单词、音标、释义等字段

### 3. PDF文档 (.pdf)
- 提取所有页面的文本
- 智能解析单词条目

### 4. 纯文本 (.txt)
- 按段落或行解析
- 自动识别结构化内容

### 5. JSON (.json)
- 智能字段匹配
- 支持数组或单个对象

## 智能识别能力

### 字段识别

系统会自动识别以下字段的各种可能命名：

#### 单词 (word)
- `word`, `Word`, `WORD`
- `单词`, `term`, `Term`
- `英文`, `english`, `English`

#### 释义 (definition)
- `definition`, `Definition`, `def`
- `meaning`, `Meaning`
- `释义`, `中文`, `翻译`, `含义`
- `chinese`, `Chinese`, `translation`

#### 音标 (IPA)
- `ipa`, `IPA`
- `phonetic`, `Phonetic`
- `音标`, `pronunciation`, `Pronunciation`

#### 英文例句 (example_en)
- `example`, `Example`, `example_en`
- `sentence`, `例句`
- `exampleSentence`, `英文例句`

#### 中文例句 (example_cn)
- `example_cn`, `exampleCn`
- `translation`, `Translation`
- `例句翻译`, `中文例句`

#### 分类 (category)
- `category`, `Category`
- `分类`, `book`, `Book`
- `书名`, `type`, `Type`

### 文本格式识别

系统支持多种文本排列格式：

#### 格式1：单行格式
```
word /ipa/ 释义
```
示例：
```
patient /ˈpeɪʃnt/ 病人
```

#### 格式2：多行格式
```
word
/ipa/
释义
例句英文
例句中文
```

示例：
```
Patient
/ˈpeɪʃnt/
病人
The nurse checked the patient.
护士检查了病人。
```

#### 格式3：冒号格式
```
word: 释义
```

示例：
```
Patient: 病人
```

#### 格式4：段落格式
```
每个单词用空行分隔，系统会自动识别每个段落中的：
- 英文单词
- 音标（在 /.../ 或 [...] 或 【...】 中）
- 中文释义（包含中文字符的行）
- 例句（以大写字母开头，标点结尾的句子）
```

## 使用方法

### 在应用中使用

导入功能已集成到现有的文件导入系统中，使用方式不变：

```typescript
import { StorageService } from './services/storageService';

// 导入文件
const words = await StorageService.importFile(file, "默认分类");
```

### 直接使用解析服务

如果需要单独使用解析功能：

```typescript
import { DocumentParserService } from './services/documentParserService';

// 解析文件
const words = await DocumentParserService.parseFile(file, "默认分类");
```

## 示例文档

### Excel示例

| word    | ipa        | definition | example                      | example_cn      | category |
|---------|------------|------------|------------------------------|-----------------|----------|
| patient | /ˈpeɪʃnt/  | 病人       | The nurse checked the patient. | 护士检查了病人。 | 护理英语 |
| nurse   | /nɜːs/     | 护士       | The nurse monitors vital signs. | 护士监测生命体征。| 护理英语 |

或者使用中文列名：

| 单词    | 音标        | 释义   | 例句                              | 例句翻译         | 分类     |
|---------|------------|--------|-----------------------------------|------------------|----------|
| patient | /ˈpeɪʃnt/  | 病人   | The nurse checked the patient.    | 护士检查了病人。 | 护理英语 |
| nurse   | /nɜːs/     | 护士   | The nurse monitors vital signs.   | 护士监测生命体征。| 护理英语 |

### 文本示例

```
Patient /ˈpeɪʃnt/ 病人
The nurse checked the patient.
护士检查了病人。

Nurse /nɜːs/ 护士
The nurse monitors vital signs.
护士监测生命体征。

Fever
/ˈfiːvə/
发烧
The child has a high fever.
孩子发高烧。
```

### JSON示例

```json
[
  {
    "word": "patient",
    "ipa": "/ˈpeɪʃnt/",
    "definition": "病人",
    "example": "The nurse checked the patient.",
    "translation": "护士检查了病人。",
    "category": "护理英语"
  },
  {
    "word": "nurse",
    "ipa": "/nɜːs/",
    "definition": "护士",
    "example": "The nurse monitors vital signs.",
    "translation": "护士监测生命体征。",
    "category": "护理英语"
  }
]
```

## 技术实现

- **Word解析**: 使用 `mammoth` 库提取文本
- **PDF解析**: 使用 `pdfjs-dist` 库提取文本
- **Excel解析**: 使用 `xlsx` 库
- **智能识别**: 基于正则表达式和启发式算法

## 注意事项

1. 确保文档内容清晰，避免过多格式干扰
2. PDF文档的识别准确度取决于PDF的文本质量
3. 对于复杂格式，建议使用Excel或JSON格式
4. 系统会自动跳过无法识别的条目

## 错误处理

如果文件解析失败，系统会：
1. 在控制台输出错误信息
2. 抛出错误，提示用户检查文件格式
3. 建议用户使用其他格式重试
