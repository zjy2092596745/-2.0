"""
信用贷款分类器 - 预测客户是否会违约
这个程序使用机器学习来预测贷款申请人是否可能违约（不还款）
支持读取 Excel 和 CSV 文件
"""

# 导入必要的库
import pandas as pd  # pandas提供数据处理功能，让我们可以轻松处理表格数据
import numpy as np  # numpy提供数学计算功能
from sklearn.model_selection import train_test_split  # 这个函数帮我们把数据分成训练集和测试集
from sklearn.preprocessing import StandardScaler, LabelEncoder  # 标准化工具和标签编码工具
from sklearn.linear_model import LogisticRegression  # 逻辑回归模型，用于二分类问题
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix  # 评估模型性能的工具
import warnings
warnings.filterwarnings('ignore')  # 忽略警告信息，让输出更清晰


class CreditLoanClassifier:
    """
    信用贷款分类器类
    这个类封装了整个机器学习流程，包括数据读取、预处理、模型训练和预测
    """

    def __init__(self):
        """初始化分类器，创建模型和数据处理工具"""
        self.model = LogisticRegression(random_state=42, max_iter=1000)  # 创建逻辑回归模型
        self.scaler = StandardScaler()  # 创建标准化工具
        self.label_encoders = {}  # 用于存储每个分类特征的编码器
        self.feature_names = None  # 用于存储特征名称
        self.is_trained = False  # 标记模型是否已训练

    def load_data(self, file_path, target_column='TARGET'):
        """
        从文件加载数据
        参数:
            file_path: 文件路径（支持 .csv 和 .xlsx 格式）
            target_column: 目标列的名称（默认为 'TARGET'，可以改为 'default' 等）
        返回:
            加载的 DataFrame 数据
        """
        print(f"正在从文件加载数据: {file_path}")

        # 根据文件扩展名判断文件类型
        if file_path.endswith('.csv'):
            # 读取CSV文件
            data = pd.read_csv(file_path)
        elif file_path.endswith('.xlsx') or file_path.endswith('.xls'):
            # 读取Excel文件
            data = pd.read_excel(file_path)
        else:
            raise ValueError("不支持的文件格式！请使用 .csv 或 .xlsx 文件")

        print(f"数据加载成功！共 {len(data)} 行，{len(data.columns)} 列")

        # 检查是否存在目标列
        if target_column not in data.columns:
            print(f"警告: 未找到目标列 '{target_column}'")
            print(f"可用的列名: {list(data.columns)}")

        return data

    def preprocess_data(self, data, target_column='TARGET'):
        """
        数据预处理：处理缺失值、编码分类变量、选择特征
        参数:
            data: 原始数据 DataFrame
            target_column: 目标列名称
        返回:
            X: 处理后的特征数据
            y: 目标变量
        """
        print("\n开始数据预处理...")

        # 复制数据，避免修改原始数据
        df = data.copy()

        # 1. 分离特征和目标变量
        if target_column in df.columns:
            y = df[target_column]  # 目标变量（0或1）
            X = df.drop(columns=[target_column])  # 特征数据
        else:
            print(f"警告: 目标列 '{target_column}' 不存在，将使用所有列作为特征")
            X = df
            y = None

        # 2. 删除ID列（如果存在）
        # ID列通常不包含预测信息，应该删除
        id_columns = ['ID', 'SK_ID_CURR', 'SK_ID_PREV']
        for col in id_columns:
            if col in X.columns:
                X = X.drop(columns=[col])
                print(f"已删除ID列: {col}")

        # 3. 识别数值型和分类型特征
        numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()
        categorical_features = X.select_dtypes(include=['object']).columns.tolist()

        print(f"\n特征统计:")
        print(f"- 数值型特征: {len(numeric_features)} 个")
        print(f"- 分类型特征: {len(categorical_features)} 个")

        # 4. 处理数值型特征的缺失值
        # 用中位数填充缺失值（中位数不受极端值影响）
        for col in numeric_features:
            if X[col].isnull().sum() > 0:
                median_value = X[col].median()
                X[col].fillna(median_value, inplace=True)
                print(f"- 数值列 '{col}' 的缺失值已用中位数 {median_value:.2f} 填充")

        # 5. 处理分类型特征
        for col in categorical_features:
            # 用最常见的值填充缺失值
            if X[col].isnull().sum() > 0:
                most_common = X[col].mode()[0]
                X[col].fillna(most_common, inplace=True)
                print(f"- 分类列 '{col}' 的缺失值已用最常见值 '{most_common}' 填充")

            # 使用标签编码将分类变量转换为数字
            # 标签编码的作用：将文本类别（如 'Male', 'Female'）转换为数字（0, 1）
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
                X[col] = self.label_encoders[col].fit_transform(X[col])
            else:
                # 如果编码器已存在（测试数据），使用已有的编码器
                X[col] = self.label_encoders[col].transform(X[col])

        # 6. 特征选择（可选）- 这里我们使用所有特征
        # 在实际应用中，可以根据特征重要性选择最相关的特征
        self.feature_names = X.columns.tolist()

        print(f"\n预处理完成！最终特征数量: {len(self.feature_names)}")

        return X, y

    def train(self, X_train, y_train):
        """
        训练模型
        参数:
            X_train: 训练集特征数据
            y_train: 训练集标签数据
        """
        print("\n" + "="*50)
        print("开始训练模型...")
        print("="*50)

        # 第一步：标准化特征数据
        # 标准化的作用是让所有特征在相同的尺度上，提高模型效果
        # 标准化公式: (x - 平均值) / 标准差
        X_train_scaled = self.scaler.fit_transform(X_train)

        # 第二步：使用训练数据训练模型
        # 模型会学习特征和目标之间的关系
        self.model.fit(X_train_scaled, y_train)

        self.is_trained = True  # 标记模型已训练
        print("✓ 模型训练完成！")

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
        print(f"左上角 ({cm[0][0]}): 正确预测为不违约的数量（真阴性）")
        print(f"右下角 ({cm[1][1] if len(cm) > 1 else 0}): 正确预测为违约的数量（真阳性）")
        print(f"右上角 ({cm[0][1] if len(cm[0]) > 1 else 0}): 错误预测为违约的数量（假阳性-误报）")
        print(f"左下角 ({cm[1][0] if len(cm) > 1 else 0}): 错误预测为不违约的数量（假阴性-漏报）\n")

        # 详细分类报告
        print("详细分类报告：")
        print(classification_report(y_test, y_pred, target_names=['不违约', '违约']))

        print("="*50)

    def predict_single(self, sample_data):
        """
        预测单个样本
        参数:
            sample_data: 单个样本的特征数据（字典或DataFrame格式）
        返回:
            prediction: 预测结果（0或1）
            probability: 预测概率
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


def create_sample_data(n_samples=1000, save_to_file=None):
    """
    创建示例信用贷款数据（模拟真实数据结构）
    参数:
        n_samples: 要生成的样本数量
        save_to_file: 如果提供文件路径，将保存数据到文件
    返回:
        DataFrame格式的数据集
    """
    print(f"生成 {n_samples} 条示例数据...")

    np.random.seed(42)  # 设置随机种子，确保每次生成的数据相同

    # 生成各种特征（模拟真实信贷数据）
    data = {
        # 数值型特征
        'AMT_INCOME_TOTAL': np.random.randint(50000, 500000, n_samples),  # 总收入
        'AMT_CREDIT': np.random.randint(100000, 1000000, n_samples),  # 信贷金额
        'AMT_ANNUITY': np.random.randint(5000, 50000, n_samples),  # 年金
        'AMT_GOODS_PRICE': np.random.randint(50000, 900000, n_samples),  # 商品价格
        'DAYS_BIRTH': np.random.randint(-25000, -7000, n_samples),  # 出生日期（负数表示多少天前）
        'DAYS_EMPLOYED': np.random.randint(-10000, 0, n_samples),  # 就业天数
        'CNT_CHILDREN': np.random.randint(0, 5, n_samples),  # 子女数量
        'CNT_FAM_MEMBERS': np.random.randint(1, 7, n_samples),  # 家庭成员数
        'REGION_POPULATION_RELATIVE': np.random.uniform(0.0, 0.1, n_samples),  # 地区人口相对值

        # 分类型特征
        'CODE_GENDER': np.random.choice(['M', 'F'], n_samples),  # 性别
        'NAME_INCOME_TYPE': np.random.choice(['Working', 'Commercial associate', 'Pensioner', 'State servant'], n_samples),  # 收入类型
        'NAME_EDUCATION_TYPE': np.random.choice(['Secondary / secondary special', 'Higher education', 'Incomplete higher'], n_samples),  # 教育程度
        'NAME_FAMILY_STATUS': np.random.choice(['Married', 'Single / not married', 'Civil marriage', 'Widow'], n_samples),  # 婚姻状况
        'NAME_HOUSING_TYPE': np.random.choice(['House / apartment', 'With parents', 'Rented apartment'], n_samples),  # 住房类型
        'OCCUPATION_TYPE': np.random.choice(['Laborers', 'Core staff', 'Sales staff', 'Managers', 'Drivers'], n_samples),  # 职业类型

        # 标志型特征（0或1）
        'FLAG_OWN_CAR': np.random.randint(0, 2, n_samples),  # 是否有车
        'FLAG_OWN_REALTY': np.random.randint(0, 2, n_samples),  # 是否有房产
        'FLAG_MOBIL': np.ones(n_samples, dtype=int),  # 是否提供手机号
        'FLAG_EMAIL': np.random.randint(0, 2, n_samples),  # 是否提供邮箱
    }

    df = pd.DataFrame(data)

    # 创建目标变量（是否违约）- TARGET列
    # 规则：收入低、贷款金额高、就业时间短的人更容易违约
    default_probability = (
        (df['AMT_CREDIT'] / df['AMT_INCOME_TOTAL']) * 0.3 +  # 贷款收入比的影响
        (1 - (abs(df['DAYS_EMPLOYED']) / 10000)) * 0.2 +  # 就业时间的影响
        (df['CNT_CHILDREN'] / 5) * 0.1 +  # 子女数量的影响
        np.random.uniform(0, 0.4, n_samples)  # 随机因素
    )

    # 确保概率在0-1之间
    default_probability = np.clip(default_probability, 0, 1)

    # 根据概率随机生成违约标签
    df['TARGET'] = (np.random.random(n_samples) < default_probability).astype(int)

    print(f"数据生成完成！")
    print(f"违约率: {df['TARGET'].mean():.2%}")

    # 保存到文件（如果指定了路径）
    if save_to_file:
        if save_to_file.endswith('.csv'):
            df.to_csv(save_to_file, index=False)
            print(f"数据已保存到: {save_to_file}")
        elif save_to_file.endswith('.xlsx'):
            df.to_excel(save_to_file, index=False)
            print(f"数据已保存到: {save_to_file}")

    return df


def main():
    """
    主函数：演示如何使用信用贷款分类器
    """
    print("="*60)
    print("        信用贷款分类器 - 支持真实数据")
    print("="*60)
    print()

    # 创建分类器对象
    classifier = CreditLoanClassifier()

    # 演示两种使用方式
    print("请选择数据来源：")
    print("1. 使用示例数据（自动生成）")
    print("2. 从文件加载数据（CSV或Excel）")

    # 这里默认使用示例数据进行演示
    # 在实际使用时，可以改为从文件读取
    use_sample_data = True  # 改为 False 可以从文件读取

    if use_sample_data:
        print("\n选择: 使用示例数据\n")
        # 第一步：创建示例数据
        data = create_sample_data(n_samples=1000, save_to_file='sample_credit_data.csv')

        # 显示数据的前几行
        print("\n数据样本展示（前5行）：")
        print(data.head())
        print(f"\n数据集包含 {len(data)} 条记录，{len(data.columns)} 个特征")
        print(f"违约样本数量: {data['TARGET'].sum()} ({data['TARGET'].sum()/len(data):.1%})")
        print(f"正常样本数量: {len(data) - data['TARGET'].sum()} ({(len(data) - data['TARGET'].sum())/len(data):.1%})")

        # 第二步：预处理数据
        X, y = classifier.preprocess_data(data, target_column='TARGET')

    else:
        print("\n选择: 从文件加载数据")
        # 从文件加载数据
        file_path = 'your_credit_data.csv'  # 修改为你的文件路径
        data = classifier.load_data(file_path, target_column='TARGET')

        # 显示数据信息
        print("\n数据概览：")
        print(data.info())

        # 预处理数据
        X, y = classifier.preprocess_data(data, target_column='TARGET')

    # 第三步：分割数据集
    # 将数据分成80%训练集和20%测试集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n数据已分割：")
    print(f"训练集: {len(X_train)} 条")
    print(f"测试集: {len(X_test)} 条")

    # 第四步：训练模型
    classifier.train(X_train, y_train)

    # 第五步：评估模型
    classifier.evaluate(X_test, y_test)

    # 第六步：演示单个样本预测
    print("\n" + "="*60)
    print("单个样本预测演示")
    print("="*60)

    # 使用测试集中的第一个样本进行演示
    sample_index = 0
    sample = X_test.iloc[sample_index:sample_index+1]
    actual_label = y_test.iloc[sample_index]

    print(f"\n样本特征（前10个）：")
    for i, (col, val) in enumerate(sample.iloc[0].items()):
        if i < 10:  # 只显示前10个特征
            print(f"  {col}: {val}")
    print("  ...")

    # 进行预测
    prediction, probability = classifier.predict_single(sample)

    print(f"\n实际标签：{'违约' if actual_label == 1 else '不违约'}")
    print(f"预测结果：{'违约' if prediction == 1 else '不违约'}")
    print(f"违约概率：{probability[1]:.2%}")
    print(f"不违约概率：{probability[0]:.2%}")

    if prediction == actual_label:
        print("\n✓ 预测正确！")
    else:
        print("\n✗ 预测错误")

    print("\n" + "="*60)
    print("程序运行完成！")
    print("="*60)
    print("\n提示：")
    print("- 示例数据已保存为 'sample_credit_data.csv'")
    print("- 要使用自己的数据，请修改代码中的 file_path 变量")
    print("- 确保数据包含 'TARGET' 列（0=不违约, 1=违约）")


# 如果直接运行这个文件，则执行main函数
if __name__ == "__main__":
    main()
