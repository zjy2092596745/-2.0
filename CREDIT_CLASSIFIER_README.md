# 信用贷款分类器使用说明

## 📚 项目简介

这是一个简单易懂的**信用贷款二进制分类器**，使用 Python 和机器学习技术来预测贷款申请人是否可能违约（不还款）。

### 什么是二进制分类？
二进制分类就是把数据分成两类的任务。在这个项目中：
- **类别 0**：客户不会违约（会按时还款）✅
- **类别 1**：客户可能违约（可能不还款）❌

## 🎯 项目特点

- ✅ **语法简单**：代码清晰易懂，适合初学者
- ✅ **中文注释**：所有代码都有详细的中文教学性注释
- ✅ **完整流程**：包含数据读取、预处理、模型训练、评估和预测的完整流程
- ✅ **支持真实数据**：可以直接读取 Excel 或 CSV 文件
- ✅ **自动预处理**：自动处理缺失值和分类变量
- ✅ **即开即用**：可以直接运行示例，也可以使用自己的数据

## 📋 环境要求

- Python 3.8 或更高版本

## 🚀 安装步骤

### 1. 安装依赖包

在命令行中运行：

```bash
pip install -r requirements.txt
```

这会安装以下包：
- `pandas` - 数据处理工具
- `numpy` - 数学计算工具
- `scikit-learn` - 机器学习工具

### 2. 运行程序

```bash
python credit_loan_classifier.py
```

## 📊 程序功能说明

### 主要功能

1. **读取数据**：支持从 Excel (.xlsx) 或 CSV (.csv) 文件读取数据
2. **自动预处理**：
   - 自动识别数值型和分类型特征
   - 自动处理缺失值（数值用中位数填充，分类用众数填充）
   - 自动编码分类变量（将文字转换为数字）
   - 自动删除ID列
3. **训练模型**：使用逻辑回归算法训练分类模型
4. **评估性能**：显示模型的准确率和详细评估报告
5. **单样本预测**：演示如何预测单个客户是否会违约

### 支持的数据特征类型

程序可以自动处理真实信贷数据，包括但不限于：

#### 数值型特征（示例）
| 特征名称 | 说明 |
|---------|------|
| `AMT_INCOME_TOTAL` | 总收入 |
| `AMT_CREDIT` | 信贷金额 |
| `AMT_ANNUITY` | 年金 |
| `AMT_GOODS_PRICE` | 商品价格 |
| `DAYS_BIRTH` | 出生日期（距今天数）|
| `DAYS_EMPLOYED` | 就业天数 |
| `CNT_CHILDREN` | 子女数量 |
| `CNT_FAM_MEMBERS` | 家庭成员数 |

#### 分类型特征（示例）
| 特征名称 | 说明 | 示例值 |
|---------|------|--------|
| `CODE_GENDER` | 性别 | M, F |
| `NAME_INCOME_TYPE` | 收入类型 | Working, Pensioner 等 |
| `NAME_EDUCATION_TYPE` | 教育程度 | Higher education 等 |
| `NAME_FAMILY_STATUS` | 婚姻状况 | Married, Single 等 |
| `NAME_HOUSING_TYPE` | 住房类型 | House / apartment 等 |
| `OCCUPATION_TYPE` | 职业类型 | Laborers, Managers 等 |

## 💡 代码结构说明

### CreditLoanClassifier 类

这是核心类，包含以下方法：

```python
# 1. 初始化分类器
classifier = CreditLoanClassifier()

# 2. 准备数据
X, y = classifier.prepare_data(data)

# 3. 训练模型
classifier.train(X_train, y_train)

# 4. 评估模型
classifier.evaluate(X_test, y_test)

# 5. 预测单个样本
prediction, probability = classifier.predict_single(sample_data)
```

## 📈 输出结果说明

### 1. 准确率 (Accuracy)
- 显示模型预测正确的比例
- 例如：准确率 85% 表示 100 个预测中有 85 个是正确的

### 2. 混淆矩阵 (Confusion Matrix)
```
[[真阴性  假阳性]
 [假阴性  真阳性]]
```
- **真阴性**：正确预测为不违约
- **真阳性**：正确预测为违约
- **假阳性**：错误预测为违约（误报）
- **假阴性**：错误预测为不违约（漏报）

### 3. 分类报告
- **Precision（精确率）**：预测为违约的样本中，真正违约的比例
- **Recall（召回率）**：所有违约样本中，被正确预测出来的比例
- **F1-score（F1分数）**：精确率和召回率的调和平均数

## 🔧 使用自己的数据

### 方法一：修改代码直接使用

1. **准备数据文件**：
   - 支持格式：CSV (.csv) 或 Excel (.xlsx)
   - **必需列**：必须包含一个目标列，通常命名为 `TARGET`（值为 0 或 1）
     - `0` = 不违约
     - `1` = 违约
   - 其他列可以是任意数值型或分类型特征

2. **修改代码**：
   打开 `credit_loan_classifier.py`，找到第 328 行附近：
   ```python
   use_sample_data = True  # 改为 False
   ```

   然后在第 348 行修改文件路径：
   ```python
   file_path = 'your_credit_data.csv'  # 改为你的文件路径
   ```

   如果目标列名不是 'TARGET'，在第 349 行修改：
   ```python
   data = classifier.load_data(file_path, target_column='TARGET')  # 改为你的目标列名
   ```

3. **运行程序**：
   ```bash
   python credit_loan_classifier.py
   ```

### 方法二：编写自己的脚本

```python
from credit_loan_classifier import CreditLoanClassifier
from sklearn.model_selection import train_test_split

# 1. 创建分类器
classifier = CreditLoanClassifier()

# 2. 加载数据（支持CSV和Excel）
data = classifier.load_data('my_credit_data.xlsx', target_column='TARGET')

# 3. 预处理数据（自动处理缺失值和分类变量）
X, y = classifier.preprocess_data(data, target_column='TARGET')

# 4. 分割训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 5. 训练模型
classifier.train(X_train, y_train)

# 6. 评估模型
classifier.evaluate(X_test, y_test)

# 7. 预测新客户（可选）
# 注意：新客户的特征必须与训练数据的特征一致
sample = X_test.iloc[0:1]  # 使用测试集的第一个样本
prediction, probability = classifier.predict_single(sample)
print(f"预测结果：{'违约' if prediction == 1 else '不违约'}")
print(f"违约概率：{probability[1]:.2%}")
```

### 数据格式示例

你的 Excel 或 CSV 文件应该类似这样：

| AMT_INCOME_TOTAL | AMT_CREDIT | CODE_GENDER | NAME_INCOME_TYPE | ... | TARGET |
|------------------|------------|-------------|------------------|-----|--------|
| 150000 | 300000 | M | Working | ... | 0 |
| 80000 | 450000 | F | Commercial associate | ... | 1 |
| 200000 | 280000 | M | State servant | ... | 0 |

**重要提示**：
- ✅ 程序会自动处理缺失值
- ✅ 程序会自动编码分类变量（如 M/F → 0/1）
- ✅ 程序会自动删除 ID 列
- ⚠️ 确保有 TARGET 列（或其他目标列名）

## 📚 学习要点

### 1. 机器学习基本流程
- **数据读取** → **数据预处理** → **模型训练** → **模型评估** → **实际应用**

### 2. 数据预处理为什么重要？
真实数据通常不完美，需要预处理：
- **处理缺失值**：很多数据会有空白项，需要用合理的值填充
- **编码分类变量**：机器学习模型只能处理数字，需要把文字（如"男"/"女"）转换为数字（0/1）
- **删除无用列**：ID列不包含预测信息，应该删除
- **标准化**：让不同范围的特征在同一尺度上

### 3. 为什么要标准化数据？
- 不同特征的数值范围差异很大（如年龄 18-70 vs 收入 50,000-500,000）
- 标准化让所有特征在相同的尺度上，提高模型效果
- 标准化公式：(值 - 平均值) / 标准差

### 4. 标签编码 vs One-Hot 编码
- **标签编码**：将分类转换为连续数字（如：男=0, 女=1）
  - 优点：简单，特征数量少
  - 缺点：可能暗示顺序关系
  - 本项目使用标签编码，保持代码简单
- **One-Hot 编码**：为每个类别创建一个新列（如：是男=1/0, 是女=1/0）
  - 优点：不暗示顺序
  - 缺点：特征数量增加

### 5. 为什么要分割训练集和测试集？
- **训练集**：用来训练模型（让模型学习）
- **测试集**：用来评估模型在未见过的数据上的表现
- 这样可以检验模型是否真的学到了规律，而不是死记硬背（过拟合）

### 6. 逻辑回归为什么适合这个任务？
- 逻辑回归是最简单有效的二分类算法
- 不仅给出分类结果（0或1），还能给出概率（0%-100%）
- 模型可解释性强，容易理解
- 训练速度快，适合初学者

## 🤔 常见问题

### Q1: 我的数据没有 TARGET 列怎么办？
A: 如果你的数据目标列叫其他名字（如 'default', 'is_bad' 等），在调用 `load_data()` 和 `preprocess_data()` 时指定 `target_column` 参数：
```python
data = classifier.load_data('file.csv', target_column='default')
X, y = classifier.preprocess_data(data, target_column='default')
```

### Q2: 我的数据有很多缺失值，程序能处理吗？
A: 可以！程序会自动处理缺失值：
- 数值型特征：用中位数填充
- 分类型特征：用最常见的值填充
处理过程会在运行时显示在控制台

### Q3: 准确率多少算好？
A: 这取决于具体应用场景。一般来说：
- 60-70%：一般
- 70-80%：良好
- 80-90%：优秀
- 90%以上：非常好（但要警惕过拟合）

对于信贷违约预测，还要关注 **召回率**（Recall）和 **精确率**（Precision）的平衡。

### Q4: 什么是过拟合？
A: 模型在训练集上表现很好，但在测试集上表现差。就像学生死记硬背，考试遇到新题目就不会了。

### Q5: 如何提高模型性能？
- 收集更多高质量的数据
- 尝试不同的特征组合或特征工程
- 尝试其他算法（如随机森林、XGBoost、神经网络）
- 调整模型参数（超参数调优）
- 处理数据不平衡问题

### Q6: 我的 Excel 文件很大，程序能处理吗？
A: 可以，但如果数据量超过几十万行，可能会比较慢。建议：
- 先用小样本测试（比如前1000行）
- 确认程序正常运行后再用完整数据

### Q7: 为什么每次运行结果都一样？
A: 因为代码中设置了 `random_state=42`，这确保了结果的可重复性，方便学习和调试。

### Q8: 我的数据只有特征，没有标签（TARGET）怎么办？
A: 如果没有标签，就无法训练监督学习模型。你需要：
- 找到已经标注的历史数据（有违约/不违约记录）
- 或者使用无监督学习方法（如聚类），但这不在本项目范围内

## 📖 扩展学习

如果你想深入学习，可以尝试：

1. **添加更多特征**：如婚姻状况、教育程度等
2. **尝试其他算法**：决策树、随机森林、支持向量机等
3. **特征工程**：创建新的组合特征
4. **模型调优**：使用网格搜索找到最佳参数
5. **处理不平衡数据**：如果违约和不违约的样本数量差异很大

## 🆘 获取帮助

如果遇到问题：
1. 检查 Python 版本是否正确
2. 确保所有依赖包已安装
3. 查看错误信息，通常会指出问题所在
4. 阅读代码注释，理解每一步的作用

## 📝 许可证

本项目仅用于学习和教育目的。

---

**祝你学习愉快！** 🎉
