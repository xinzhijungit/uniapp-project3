import struct
import zlib
import os

def create_png(width, height, r, g, b):
    signature = b'\x89PNG\r\n\x1a\n'
    
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr = b'IHDR' + ihdr_data
    ihdr_crc = zlib.crc32(ihdr) & 0xffffffff
    ihdr_chunk = struct.pack('>I', len(ihdr_data)) + ihdr + struct.pack('>I', ihdr_crc)
    
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'
        for x in range(width):
            raw_data += bytes([r, g, b, 255])
    
    compressed = zlib.compress(raw_data)
    idat = b'IDAT' + compressed
    idat_crc = zlib.crc32(idat) & 0xffffffff
    idat_chunk = struct.pack('>I', len(compressed)) + idat + struct.pack('>I', idat_crc)
    
    iend_chunk = b'\x00\x00\x00\x00IEND\xaeB`\x82'
    
    return signature + ihdr_chunk + idat_chunk + iend_chunk

images = [
    ('人.png', '#2196F3'),
    ('案件.png', '#F44336'),
    ('民警.png', '#4CAF50'),
    ('户籍.png', '#FF9800'),
    ('案底.png', '#9C27B0')
]

os.makedirs('static/images/graph', exist_ok=True)

for name, color in images:
    r = int(color[1:3], 16)
    g = int(color[3:5], 16)
    b = int(color[5:7], 16)
    png = create_png(48, 48, r, g, b)
    with open(f'static/images/graph/{name}', 'wb') as f:
        f.write(png)
    print(f'Created: {name} ({color})')

print('All icons generated successfully!')
