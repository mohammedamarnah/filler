import cv2
import random
import redis
import time
import json
import numpy as np

height = 512
width = 512
n = 80 # single square size
colors = {
        'B': [218,165,32],
        'R': [128,128,0],
        'G': [64,224,208],
        'Y': [138,43,226],
        'P': [199,21,133],
        'b': [0,0,0]
        }
# TODO: load env-specific redis config from external yml.
config = {'host': 'localhost', 'port': '6379', 'db': 0}

def setup_redis():
    r = redis.Redis(host=config['host'], port=config['port'], db=config['db'])
    return r

def construct_image(board):
    image = np.zeros((height,width,3), np.uint8)
    for row in range(0, height - n - 1, n):
        for col in range(0, width - n - 1, n):
            color = colors[board[row/n][col/n]]
            for i in range(row, row + n, 1):
                for j in range (col, col + n, 1):
                    image[i][j] = color

def main():
    client = setup_redis()
    while True:
        cmd = client.rpop("boards")
        if cmd != None:
            res = json.loads(cmd)
            image = construct_image(res['board'])
            name = str(res['id']) + ".png"
            cv2.imwrite(name, image)
            client.rpush("finished_jobs", image)
        time.sleep(0.5)

if __name__ == "__main__":
    main()
