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
- ✅ **完整流程**：包含数据生成、模型训练、评估和预测的完整流程
- ✅ **即开即用**：可以直接运行，无需额外准备数据

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

1. **自动生成数据**：程序会自动生成 1000 条模拟的贷款申请数据
2. **训练模型**：使用逻辑回归算法训练分类模型
3. **评估性能**：显示模型的准确率和详细评估报告
4. **单样本预测**：演示如何预测单个客户是否会违约

### 数据特征说明

程序使用以下 6 个特征来预测违约风险：

| 特征名称 | 说明 | 范围 |
|---------|------|------|
| `age` | 客户年龄 | 18-70 岁 |
| `income` | 年收入 | 20,000-200,000 元 |
| `loan_amount` | 贷款金额 | 5,000-100,000 元 |
| `credit_score` | 信用分数 | 300-850 分 |
| `employment_years` | 工作年限 | 0-40 年 |
| `debt_ratio` | 负债比率 | 0-1 |

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

## 🔧 自定义使用

### 使用自己的数据

```python
import pandas as pd
from credit_loan_classifier import CreditLoanClassifier

# 1. 加载你的数据
data = pd.read_csv('your_data.csv')

# 2. 确保数据包含必需的列
# 特征列: age, income, loan_amount, credit_score, employment_years, debt_ratio
# 目标列: default (0 或 1)

# 3. 创建并训练分类器
classifier = CreditLoanClassifier()
X, y = classifier.prepare_data(data)

# 4. 分割训练集和测试集
from sklearn.model_selection import train_test_split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# 5. 训练和评估
classifier.train(X_train, y_train)
classifier.evaluate(X_test, y_test)
```

### 预测新客户

```python
# 准备新客户的信息
new_customer = {
    'age': 30,
    'income': 60000,
    'loan_amount': 20000,
    'credit_score': 680,
    'employment_years': 5,
    'debt_ratio': 0.4
}

# 进行预测
prediction, probability = classifier.predict_single(new_customer)

print(f"预测结果：{'违约' if prediction == 1 else '不违约'}")
print(f"违约概率：{probability[1]:.2%}")
```

## 📚 学习要点

### 1. 机器学习基本流程
- **数据准备** → **模型训练** → **模型评估** → **实际应用**

### 2. 为什么要标准化数据？
- 不同特征的数值范围差异很大（如年龄 vs 收入）
- 标准化让所有特征在同一尺度上，提高模型效果

### 3. 为什么要分割训练集和测试集？
- **训练集**：用来训练模型
- **测试集**：用来评估模型在未见过的数据上的表现
- 这样可以检验模型是否真的学到了规律，而不是死记硬背

### 4. 逻辑回归为什么适合这个任务？
- 逻辑回归是最简单有效的二分类算法
- 不仅给出分类结果，还能给出概率
- 模型可解释性强，容易理解

## 🤔 常见问题

### Q1: 准确率多少算好？
A: 这取决于具体应用场景。一般来说：
- 60-70%：一般
- 70-80%：良好
- 80-90%：优秀
- 90%以上：非常好（但要警惕过拟合）

### Q2: 什么是过拟合？
A: 模型在训练集上表现很好，但在测试集上表现差。就像学生死记硬背，考试遇到新题目就不会了。

### Q3: 如何提高模型性能？
- 收集更多高质量的数据
- 尝试不同的特征组合
- 尝试其他算法（如随机森林、XGBoost）
- 调整模型参数

### Q4: 为什么每次运行结果都一样？
A: 因为代码中设置了 `random_state=42`，这确保了结果的可重复性，方便学习和调试。

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
