// Type definitions for Bluetooth assigned numbers
interface BluetoothService {
  uuid: string;
  name: string;
  id: string;
}

interface BluetoothCharacteristic {
  uuid: string;
  name: string;
  id: string;
}

// Type definitions for service and characteristic info
export interface ServiceInfo {
  uuid: string;
  name: string;
  characteristics?: CharacteristicInfo[];
}

export interface CharacteristicInfo {
  uuid: string;
  name: string;
  properties: {
    read: boolean;
    write: boolean;
    notify: boolean;
    indicate: boolean;
  };
  value?: string;
}

// Service and characteristic mappings will be loaded from YAML files
let servicesMap = new Map<string, BluetoothService>();
let characteristicsMap = new Map<string, BluetoothCharacteristic>();

// Function to initialize the UUID maps from YAML files
export const initializeBluetoothUuidMaps = async () => {
  try {
    // Load service UUIDs
    const servicesResponse = await fetch('/bluetooth/assigned_numbers/uuids/service_uuids.yaml');
    const servicesText = await servicesResponse.text();
    const servicesYaml = parseYaml(servicesText);
    
    if (servicesYaml && Array.isArray(servicesYaml.uuids)) {
      servicesYaml.uuids.forEach((service: any) => {
        servicesMap.set(service.uuid.toLowerCase(), service);
        // Also add the hex value without '0x' prefix for matching
        if (service.uuid.startsWith('0x')) {
          servicesMap.set(service.uuid.substring(2).toLowerCase(), service);
        }
      });
    }

    // Load characteristic UUIDs
    const characteristicsResponse = await fetch('/bluetooth/assigned_numbers/uuids/characteristic_uuids.yaml');
    const characteristicsText = await characteristicsResponse.text();
    const characteristicsYaml = parseYaml(characteristicsText);
    
    if (characteristicsYaml && Array.isArray(characteristicsYaml.uuids)) {
      characteristicsYaml.uuids.forEach((characteristic: any) => {
        characteristicsMap.set(characteristic.uuid.toLowerCase(), characteristic);
        // Also add the hex value without '0x' prefix for matching
        if (characteristic.uuid.startsWith('0x')) {
          characteristicsMap.set(characteristic.uuid.substring(2).toLowerCase(), characteristic);
        }
      });
    }
  } catch (error) {
    console.error('Error initializing Bluetooth UUID maps:', error);
  }
};

// Simple YAML parser for the specific format used in these files
const parseYaml = (yamlText: string): any => {
  const lines = yamlText.split('\n');
  const result: any = { uuids: [] };
  let currentEntry: any = null;
  let inUuidsSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines and comments
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Check if we're entering the uuids section
    if (trimmedLine === 'uuids:') {
      inUuidsSection = true;
      continue;
    }
    
    if (!inUuidsSection) {
      continue;
    }
    
    // Check for new entry (starts with -)
    if (line.trimStart().startsWith('- ')) {
      // Save previous entry if exists
      if (currentEntry) {
        result.uuids.push(currentEntry);
      }
      
      // Start new entry
      currentEntry = {};
      
      // Parse the current line for uuid
      const uuidMatch = line.match(/- uuid:\s*(.+)/);
      if (uuidMatch) {
        currentEntry.uuid = uuidMatch[1].trim();
      }
      
      // Look ahead for name and id on subsequent lines
      let nextLineIndex = i + 1;
      while (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex];
        const nextTrimmed = nextLine.trim();
        
        // Stop if we hit a new entry or end of file
        if (nextTrimmed === '' || nextTrimmed.startsWith('#') || nextLine.trimStart().startsWith('- ')) {
          break;
        }
        
        // Check for name
        const nameMatch = nextLine.match(/\s*name:\s*(.+)/);
        if (nameMatch) {
          currentEntry.name = nameMatch[1].trim();
        }
        
        // Check for id
        const idMatch = nextLine.match(/\s*id:\s*(.+)/);
        if (idMatch) {
          currentEntry.id = idMatch[1].trim();
        }
        
        nextLineIndex++;
      }
      
      // Skip the lines we've already processed
      i = nextLineIndex - 1;
    }
  }
  
  // Add the last entry
  if (currentEntry) {
    result.uuids.push(currentEntry);
  }
  
  return result;
};

// Helper function to extract short UUID from full UUID
const extractShortUuid = (fullUuid: string): string | null => {
  // Full UUID format: 00001816-0000-1000-8000-00805f9b34fb
  // We want to extract the first 4 hex digits after the leading zeros
  const match = fullUuid.match(/^0000([0-9a-f]{4})-/i);
  if (match) {
    return match[1].toLowerCase();
  }
  // If it's already a short UUID format like "1816"
  if (/^[0-9a-f]{4}$/i.test(fullUuid)) {
    return fullUuid.toLowerCase();
  }
  return null;
};

// Function to get a service name by UUID
export const getServiceName = (uuid: string): string => {
  const normalizedUuid = uuid.toLowerCase();
  
  // First try exact match
  let service = servicesMap.get(normalizedUuid);
  if (service) {
    return service.name;
  }
  
  // Try with '0x' prefix
  service = servicesMap.get(`0x${normalizedUuid}`);
  if (service) {
    return service.name;
  }
  
  // Try extracting short UUID from full UUID
  const shortUuid = extractShortUuid(normalizedUuid);
  if (shortUuid) {
    service = servicesMap.get(shortUuid) || servicesMap.get(`0x${shortUuid}`);
    if (service) {
      return service.name;
    }
  }
  
  return 'Unknown Service';
};

// Function to get a characteristic name by UUID
export const getCharacteristicName = (uuid: string): string => {
  const normalizedUuid = uuid.toLowerCase();
  
  // First try exact match
  let characteristic = characteristicsMap.get(normalizedUuid);
  if (characteristic) {
    return characteristic.name;
  }
  
  // Try with '0x' prefix
  characteristic = characteristicsMap.get(`0x${normalizedUuid}`);
  if (characteristic) {
    return characteristic.name;
  }
  
  // Try extracting short UUID from full UUID
  const shortUuid = extractShortUuid(normalizedUuid);
  if (shortUuid) {
    characteristic = characteristicsMap.get(shortUuid) || characteristicsMap.get(`0x${shortUuid}`);
    if (characteristic) {
      return characteristic.name;
    }
  }
  
  return 'Unknown Characteristic';
};

// Function to enhance service information with proper names
export const enhanceServiceInfo = (service: ServiceInfo): ServiceInfo => {
  return {
    ...service,
    name: getServiceName(service.uuid) || service.name || 'Unknown Service',
    characteristics: service.characteristics?.map(char => ({
      ...char,
      name: getCharacteristicName(char.uuid) || char.name || 'Unknown Characteristic'
    }))
  };
};

// Function to enhance characteristic information with proper names
export const enhanceCharacteristicInfo = (char: CharacteristicInfo): CharacteristicInfo => {
  return {
    ...char,
    name: getCharacteristicName(char.uuid) || char.name || 'Unknown Characteristic'
  };
};

// Export functions to get all UUID mappings for debugging
export const getAllServiceMappings = (): BluetoothService[] => {
  // Use a Set to ensure unique values (avoid duplicates from different keys pointing to same object)
  return Array.from(new Set(servicesMap.values()));
};

export const getAllCharacteristicMappings = (): BluetoothCharacteristic[] => {
  // Use a Set to ensure unique values (avoid duplicates from different keys pointing to same object)
  return Array.from(new Set(characteristicsMap.values()));
};

export const isUuidMapsLoaded = (): boolean => {
  return servicesMap.size > 0 && characteristicsMap.size > 0;
};