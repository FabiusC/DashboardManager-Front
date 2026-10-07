import json

# =============================================================================
# =========================== functions =======================================
# =============================================================================

# read json file
def read_json_files(path_file):
    with open(path_file) as file:
        data = json.load(file)
    return data

def concat_arrays(array1, array2):
    return array1 + array2

def concat_n_arrays(arrays):
    concat_arrays = []
    for array in arrays:
        concat_arrays += array
    return concat_arrays

# group licenses by 'LicenseText'
def group_by_text_licenses2(licenses_stack):
    licenses_grouped = {}
    for license in licenses_stack:
        license_text = license['LicenseText']
        if license_text not in licenses_grouped:
            licenses_grouped[license_text] = []
        licenses_grouped[license_text].append(license)

    return licenses_grouped

def remove_duplicates(licenses_stack):
    licenses_stack_no_duplicates = []
    for license in licenses_stack:
        if license not in licenses_stack_no_duplicates:
            licenses_stack_no_duplicates.append(license)
    return licenses_stack_no_duplicates

def create_json_file(data, path_file):
    with open(path_file, 'w') as file:
        json.dump(data, file, indent=4)

def group_by_text_licenses(licenses_stack):
    licenses_grouped = []
    for license in licenses_stack:
        license_text = license['LicenseText']
        license_name = license['License']
        app_name     = license['Name']
        app_version  = license['Version']
        found        = False
        for entry in licenses_grouped:
            if entry['LicenseText'] == license_text and entry['LicenseName'] == license_name:
                if app_name in entry['Applications']:
                    entry['Applications'][app_name].append(app_version)
                else:
                    entry['Applications'][app_name] = [app_version]
                found = True
                break
        if not found:
            licenses_grouped.append({
                'LicenseName': license_name,
                'LicenseText': license_text,
                'Applications': {app_name: [app_version]}
            })
    return licenses_grouped


# =============================================================================
# =========================== variables =======================================
# =============================================================================

path_licenses_DSM            = './data/DSM_licenses.json'
path_licenses_DSQM           = './data/DSQM_licenses.json'
path_licenses_CREANGEL_AUTH  = './data/CREANGEL_AUTH_licenses.json'
path_licenses_DATA_CATALOG   = './data/DATA_CATALOG_licenses.json'
path_licenses_INFRASTRUCTURE = './data/INFRASTRUCTURE_licenses.json'

path_licenses = './licenses_file/licenses.json'

# =============================================================================
# =========================== main ============================================
# =============================================================================

licenses_DSM            = read_json_files(path_licenses_DSM)
licenses_DSQM           = read_json_files(path_licenses_DSQM)
licenses_CREANGEL_AUTH  = read_json_files(path_licenses_CREANGEL_AUTH)
licenses_DATA_CATALOG   = read_json_files(path_licenses_DATA_CATALOG)
licenses_INFRASTRUCTURE = read_json_files(path_licenses_INFRASTRUCTURE)

array_licenses = [licenses_DSM,
                  licenses_DSQM,
                  licenses_CREANGEL_AUTH,
                  licenses_DATA_CATALOG,
                  licenses_INFRASTRUCTURE]

#print("licenses_DSM ",                       licenses_DSM)
#print("licenses_DSQM ",                     licenses_DSQM)
#print("licenses_CREANGEL_AUTH ",   licenses_CREANGEL_AUTH)
#print("licenses_DATA_CATALOG ",     licenses_DATA_CATALOG)
#print("licenses_INFRASTRUCTURE ", licenses_INFRASTRUCTURE)

license_stack = concat_n_arrays(array_licenses)
license_stack = remove_duplicates(license_stack)

print("len(license_stack) ", len(license_stack))
#print("license_stack ", license_stack)

grouped_licenses = group_by_text_licenses(license_stack)

print("grouped_licenses ", grouped_licenses)
print("grouped_licenses:\n", json.dumps(grouped_licenses, indent=4))
#print("grouped_licenses:\n", grouped_licenses)
print("len(grouped_licenses) ", len(grouped_licenses))
print("len(license_stack) ", len(license_stack))

create_json_file(grouped_licenses, path_licenses)

#file_path = 'lincense_test.txt'
#try:
#    with open(file_path, 'r') as file:
#        # Paso 2: Leer el contenido del archivo
#        file_content = file.read()
#        print("Contenido del archivo:")
#        file = f"r{file_content}"
#        print(repr(file_content))
#except FileNotFoundError:
#    print("hola mundo")
