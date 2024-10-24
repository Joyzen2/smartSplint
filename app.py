from flask import Flask, request, send_from_directory
from flask import jsonify, render_template
import mysql.connector
from mysql.connector import Error
from datetime import datetime

app = Flask(__name__)

insert_count = 1  # 用于跟踪成功插入次数
hasPrintMessage = False

# My db_config
db_config = {
    'user': 'root',
    'password': '135890',
    'host': 'localhost',
    'database': 'mydata'
}

# other db_config
db_config_2 = {'user': '', 'password': '', 'host': '', 'database': ''}


# 提供 HTML 页面
@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


# 提供静态资源
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)


# 将消息存到数据库
# 注意： 这是一个非持续性连接
@app.route('/', methods=['POST'])
def home():
    global insert_count
    global hasPrintMessage

    data = request.json

    # 得到payload
    payload_str = data.get('payload')
    print("Payload from EMQX:")
    print(payload_str)

    # 解析逗号分隔的字符串为数值
    try:
        values = [int(val.strip()) for val in payload_str.split(',')]
        if len(values) != 4:  # 修改为4个值
            raise ValueError("Payload does not contain 4 values")

        # 解包数值
        temperature, humidity, proximalPressure, breakPressure = values  # 去掉distalPressure
        # 生成当前时间
        date_time = datetime.now()

    except ValueError as e:
        print(f"Error parsing payload: {e}")
        return f"Error parsing payload: {e}", 400

    # 将消息存储到数据库
    try:
        cnx = mysql.connector.connect(**db_config)  # 更改连接的数据库
        if cnx.is_connected():
            if not hasPrintMessage:
                print("Successfully connected to the " +
                      db_config.get('database') + " database")
                hasPrintMessage = True
            try:
                cursor = cnx.cursor()
                TABLE = "sensor_records"  # 插入表
                add_record = (
                    "INSERT INTO " + TABLE +
                    "(date, temperature, humidity, proximalPressure, breakPressure) "
                    "VALUES (%s, %s, %s, %s, %s)")  # 更新插入的字段
                data_record = (date_time, temperature, humidity,
                               proximalPressure, breakPressure)
                cursor.execute(add_record, data_record)
                cnx.commit()  # 保存

                print(f"Record ({insert_count}) into {TABLE} successfully")
                insert_count += 1  # 增加计数
                print()

            except Error as err:
                print(f"Error inserting record: {err}")
                return f"Error inserting record: {err}", 500
            finally:
                cursor.close()
                cnx.close()
        else:
            print("Failed to connected to the " + db_config.get('database') +
                  " database")
            return "Failed to connect to the database", 500
    except Error as err:
        print(f"Database error: {err}")
        return f"Database error: {err}", 500

    return '', 204  # 使用 204 No Content，表示成功处理了请求但不返回任何内容


# 新增 API 路由，获取历史数据
@app.route('/api/history')
def get_history():
    try:
        cnx = mysql.connector.connect(**db_config)
        cursor = cnx.cursor(dictionary=True)
        cursor.execute(
            'SELECT date, temperature, humidity, proximalPressure, breakPressure FROM sensor_records ORDER BY date ASC'
        )  # 修改SQL查询语句，移除distalPressure字段
        results = cursor.fetchall()
        cursor.close()
        cnx.close()
        return jsonify(results)
    except Error as err:
        print(f"Database error: {err}")
        return f"Database error: {err}", 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
