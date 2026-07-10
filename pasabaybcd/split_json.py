import json
import os

def split_json():
    seed_file = 'mongodb_seed.json'
    if not os.path.exists(seed_file):
        print(f"Error: {seed_file} not found")
        return

    with open(seed_file, 'r') as f:
        data = json.load(f)

    for collection_name, collection_data in data.items():
        if isinstance(collection_data, list):
            out_file = f"{collection_name}.json"
            with open(out_file, 'w') as f:
                json.dump(collection_data, f, indent=2)
            print(f"Created {out_file} with {len(collection_data)} records.")

if __name__ == '__main__':
    split_json()
