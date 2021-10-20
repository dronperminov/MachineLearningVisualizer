import json
from argparse import ArgumentParser
from pathlib import Path
from math import sqrt


def norm(vec):
    dot = 0

    for v in vec:
        dot += v*v

    return sqrt(dot)


def main():
    parser = ArgumentParser(description='script for export latest wiki pages')
    parser.add_argument('-i', '--input_file', type=Path, help='<path to txt file with embedding (word2vec format)>', required=True)
    parser.add_argument('-o', '--output_file', type=Path, help='<path to json file with json embedding>', required=True)

    args = parser.parse_args()

    embedding = dict()

    with open(args.input_file, encoding='utf-8') as f:
        embedding['size'] = int(f.readline().strip('\n').split(' ')[1])
        embedding['embedding'] = dict()

        for line in f:
            word, *vector = line.strip().split(' ')
            assert(len(vector) == embedding['size'])
            vector = [float(v) for v in vector]
            embedding['embedding'][word] = { 'vector': vector, 'len': norm(vector)}

    with open(args.output_file, 'w', encoding='utf-8') as f:
        json.dump(embedding, f)


if __name__ == '__main__':
    main()
