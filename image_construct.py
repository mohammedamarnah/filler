import cv2
import sys
import json
import numpy as np

'''
textual board size is [8, 8], this is because
512 / 64 = 8. Each 64x64 submatrix is gonna
represent a cell in the original 8x8 board.
'''
height = 512
width = 512
n = 64 # single square size

colors = {
        'B': [218,165,32],
        'R': [128,128,0],
        'G': [64,224,208],
        'Y': [138,43,226],
        'P': [199,21,133],
        'b': [0,0,0]
        }

def construct_image(board):
    image = np.zeros((height,width,3), np.uint8)
    for row in range(0, height, n):
        for col in range(0, width, n):
            color = colors[board[row//n][col//n]]
            for i in range(row, row + n, 1):
                for j in range (col, col + n, 1):
                    image[i][j] = color
    return image

def main():
    cmd = sys.argv[1]
    res = json.loads(cmd)
    image = construct_image(res['board'])
    name = str(res['id']) + ".png"
    cv2.imwrite(name, image)

if __name__ == "__main__":
    main()

