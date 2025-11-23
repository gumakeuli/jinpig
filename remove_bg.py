import os
from PIL import Image

def remove_green_background(image_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # r, g, b, a = item
            r = item[0]
            g = item[1]
            b = item[2]
            
            # Green screen detection logic: G > 100 and G > R+50 and G > B+50
            if g > 100 and g > r + 50 and g > b + 50:
                newData.append((r, g, b, 0)) # Transparent
            else:
                newData.append(item)

        img.putdata(newData)
        
        # Save as PNG
        file_name = os.path.splitext(os.path.basename(image_path))[0]
        dir_name = os.path.dirname(image_path)
        new_path = os.path.join(dir_name, f"{file_name}.png")
        
        img.save(new_path, "PNG")
        print(f"Processed: {image_path} -> {new_path}")
        return new_path
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

# Target directory
target_dir = r"c:\Users\i712\Desktop\진돼지\assets\images\items"

# Process all images in the directory
for filename in os.listdir(target_dir):
    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        file_path = os.path.join(target_dir, filename)
        remove_green_background(file_path)
