import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'aoqrwe-super-secret-key-12345'
    MYSQL_HOST = 'localhost'
    MYSQL_USER = 'root'
    MYSQL_PASSWORD = ''
    MYSQL_DB = 'AOQRWE'
