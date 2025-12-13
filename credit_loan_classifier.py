"""
信用贷款分类器 - 预测客户是否会违约
这个程序使用机器学习来预测贷款申请人是否可能违约（不还款）
"""

# 导入必要的库
import pandas as pd  # pandas提供数据处理功能，让我们可以轻松处理表格数据
import numpy as np  # numpy提供数学计算功能
from sklearn.model_selection import train_test_split  # 这个函数帮我们把数据分成训练集和测试集
from sklearn.preprocessing import StandardScaler  # 标准化工具，让不同范围的数据在同一尺度上
from sklearn.linear_model import LogisticRegression  # 逻辑回归模型，用于二分类问题
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix  # 评估模型性能的工具
import warnings
warnings.filterwarnings('ignore')  # 忽略警告信息，让输出更清晰


class CreditLoanClassifier:
    """
    信用贷款分类器类
    这个类封装了整个机器学习流程，包括数据准备、模型训练和预测
    """

    def __init__(self):
        """初始化分类器，创建模型和数据标准化工具"""
        self.model = LogisticRegression(random_state=42)  # 创建逻辑回归模型，random_state确保结果可重复
        self.scaler = StandardScaler()  # 创建标准化工具
        self.is_trained = False  # 标记模型是否已训练

    def prepare_data(self, data):
        """
        准备训练数据
        参数:
            data: DataFrame格式的原始数据
        返回:
            X: 特征数据（用于预测的输入）
            y: 标签数据（我们要预测的目标：0=不违约，1=违约）
        """
        # 从数据中分离特征和标签
        X = data.drop('default', axis=1)  # 删除'default'列，剩下的都是特征
        y = data['default']  # 'default'列是我们的目标变量

        return X, y

    def train(self, X_train, y_train):
        """
        训练模型
        参数:
            X_train: 训练集特征数据
            y_train: 训练集标签数据
        """
        print("开始训练模型...")

        # 第一步：标准化特征数据
        # 标准化的作用是让所有特征在相同的尺度上，提高模型效果
        X_train_scaled = self.scaler.fit_transform(X_train)

        # 第二步：使用训练数据训练模型
        self.model.fit(X_train_scaled, y_train)

        self.is_trained = True  # 标记模型已训练
        print("模型训练完成！")

    def predict(self, X_test):
        """
        使用训练好的模型进行预测
        参数:
            X_test: 测试集特征数据
        返回:
            预测结果（0或1的数组）
        """
        if not self.is_trained:
            raise Exception("模型还没有训练！请先调用train()方法")

        # 使用训练时的标准化参数对测试数据进行标准化
        X_test_scaled = self.scaler.transform(X_test)

        # 进行预测
        predictions = self.model.predict(X_test_scaled)

        return predictions

    def evaluate(self, X_test, y_test):
        """
        评估模型性能
        参数:
            X_test: 测试集特征数据
            y_test: 测试集真实标签
        """
        # 获取预测结果
        y_pred = self.predict(X_test)

        # 计算准确率：预测正确的样本数 / 总样本数
        accuracy = accuracy_score(y_test, y_pred)

        print("\n" + "="*50)
        print("模型评估结果")
        print("="*50)
        print(f"\n准确率: {accuracy:.2%}")
        print(f"这意味着模型在 {len(y_test)} 个测试样本中，正确预测了 {int(accuracy * len(y_test))} 个\n")

        # 混淆矩阵：展示预测对错的详细情况
        print("混淆矩阵（Confusion Matrix）：")
        print("显示预测结果与实际结果的对比")
        cm = confusion_matrix(y_test, y_pred)
        print(cm)
        print(f"左上角 ({cm[0][0]}): 正确预测为不违约的数量")
        print(f"右下角 ({cm[1][1]}): 正确预测为违约的数量")
        print(f"右上角 ({cm[0][1]}): 错误预测为违约的数量（误报）")
        print(f"左下角 ({cm[1][0]}): 错误预测为不违约的数量（漏报）\n")

        # 详细分类报告
        print("详细分类报告：")
        print(classification_report(y_test, y_pred,
                                   target_names=['不违约', '违约']))

    def predict_single(self, sample_data):
        """
        预测单个样本
        参数:
            sample_data: 单个样本的特征数据（字典或DataFrame格式）
        返回:
            预测结果和概率
        """
        if not self.is_trained:
            raise Exception("模型还没有训练！请先调用train()方法")

        # 如果是字典，转换为DataFrame
        if isinstance(sample_data, dict):
            sample_data = pd.DataFrame([sample_data])

        # 标准化并预测
        sample_scaled = self.scaler.transform(sample_data)
        prediction = self.model.predict(sample_scaled)[0]
        probability = self.model.predict_proba(sample_scaled)[0]

        return prediction, probability


def create_sample_data(n_samples=1000):
    """
    创建示例信用贷款数据
    参数:
        n_samples: 要生成的样本数量
    返回:
        DataFrame格式的数据集
    """
    print(f"生成 {n_samples} 条示例数据...")

    np.random.seed(42)  # 设置随机种子，确保每次生成的数据相同

    # 生成各种特征
    data = {
        'age': np.random.randint(18, 70, n_samples),  # 年龄：18-70岁
        'income': np.random.randint(20000, 200000, n_samples),  # 年收入：2万-20万
        'loan_amount': np.random.randint(5000, 100000, n_samples),  # 贷款金额：5千-10万
        'credit_score': np.random.randint(300, 850, n_samples),  # 信用分数：300-850
        'employment_years': np.random.randint(0, 40, n_samples),  # 工作年限：0-40年
        'debt_ratio': np.random.uniform(0, 1, n_samples),  # 负债比率：0-1
    }

    df = pd.DataFrame(data)

    # 创建目标变量（是否违约）
    # 规则：信用分数低、负债比高、收入低的人更容易违约
    default_probability = (
        (850 - df['credit_score']) / 550 * 0.3 +  # 信用分数的影响
        df['debt_ratio'] * 0.3 +  # 负债比率的影响
        (100000 - df['loan_amount']) / 100000 * 0.2 +  # 贷款金额的影响
        (200000 - df['income']) / 200000 * 0.2  # 收入的影响
    )

    # 根据概率随机生成违约标签
    df['default'] = (np.random.random(n_samples) < default_probability).astype(int)

    print("数据生成完成！")
    return df


def main():
    """
    主函数：演示如何使用信用贷款分类器
    """
    print("="*50)
    print("信用贷款分类器演示程序")
    print("="*50)
    print()

    # 第一步：创建示例数据
    data = create_sample_data(n_samples=1000)

    # 显示数据的前几行
    print("\n数据样本展示（前5行）：")
    print(data.head())
    print(f"\n数据集包含 {len(data)} 条记录")
    print(f"违约样本数量: {data['default'].sum()} ({data['default'].sum()/len(data):.1%})")
    print(f"正常样本数量: {len(data) - data['default'].sum()} ({(len(data) - data['default'].sum())/len(data):.1%})")

    # 第二步：创建分类器对象
    classifier = CreditLoanClassifier()

    # 第三步：准备数据
    X, y = classifier.prepare_data(data)

    # 第四步：分割数据集
    # 将数据分成80%训练集和20%测试集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\n数据已分割：")
    print(f"训练集: {len(X_train)} 条")
    print(f"测试集: {len(X_test)} 条")

    # 第五步：训练模型
    print()
    classifier.train(X_train, y_train)

    # 第六步：评估模型
    classifier.evaluate(X_test, y_test)

    # 第七步：演示单个样本预测
    print("\n" + "="*50)
    print("单个样本预测演示")
    print("="*50)

    # 创建一个测试样本
    sample = {
        'age': 35,
        'income': 80000,
        'loan_amount': 30000,
        'credit_score': 720,
        'employment_years': 10,
        'debt_ratio': 0.3
    }

    print("\n客户信息：")
    for key, value in sample.items():
        print(f"  {key}: {value}")

    # 进行预测
    prediction, probability = classifier.predict_single(sample)

    print(f"\n预测结果：{'违约' if prediction == 1 else '不违约'}")
    print(f"违约概率：{probability[1]:.2%}")
    print(f"不违约概率：{probability[0]:.2%}")

    print("\n" + "="*50)
    print("程序运行完成！")
    print("="*50)


# 如果直接运行这个文件，则执行main函数
if __name__ == "__main__":
    main()
