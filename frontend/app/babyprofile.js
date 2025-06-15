import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

// Utility function to generate a unique ID
function generateUniqueID() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

export default function BabyProfileScreen() {
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState('');
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('Male');
  
  // For storing multiple baby profiles in this session
  const [babies, setBabies] = useState([]);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dob;
    setShowDatePicker(Platform.OS === 'ios');
    setDob(currentDate);
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date) => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  // Create a baby profile object with serialized date
  const createBabyProfile = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your baby\'s name');
      return null;
    }
    if (!height.trim()) {
      Alert.alert('Error', 'Please enter height');
      return null;
    }
    if (!weight.trim()) {
      Alert.alert('Error', 'Please enter weight');
      return null;
    }

    // Convert Date object to ISO string for safe navigation parameter passing
    return {
      id: generateUniqueID(),
      name,
      dob: dob.toISOString(),
      height,
      weight,
      gender,
    };
  };

  // Save baby profile and navigate to Dashboard (finishing the process)
  const handleSaveAndContinue = () => {
    const newBaby = createBabyProfile();
    if (!newBaby) return;

    const updatedBabies = [...babies, newBaby];
    setBabies(updatedBabies);

    Alert.alert(
      'Baby Profile Saved',
      `Profile Details:\nID: ${newBaby.id}\nName: ${name}\nDOB: ${formatDate(dob)}\nGender: ${gender}\nHeight: ${height} cm\nWeight: ${weight} kg`,
      [
        {
          text: 'OK',
          onPress: () => router.push({
            pathname: '/dashboard',
            params: { babies: JSON.stringify(updatedBabies) }
          })
        }
      ]
    );
  };

  // Save baby profile and clear form for adding another baby
  const handleSaveAndAddAnother = () => {
    const newBaby = createBabyProfile();
    if (!newBaby) return;

    setBabies(prev => [...prev, newBaby]);

    Alert.alert(
      'Baby Profile Saved',
      `Profile Saved:\nID: ${newBaby.id}\nName: ${name}\nDOB: ${formatDate(dob)}\nGender: ${gender}\nHeight: ${height} cm\nWeight: ${weight} kg`
    );

    // Clear form fields for new entry
    setName('');
    setDob(new Date());
    setHeight('');
    setWeight('');
    setGender('Male');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Baby Profile</Text>
        <Text style={styles.subtitle}>Tell us about your little one</Text>

        {/* Baby Name */}
        <View style={{width: '100%'}}>
          <Text style={styles.inputLabel}>Baby's Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Gender Picker */}
        <View style={{width: '100%'}}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
              style={styles.picker}
              mode="dropdown"
            >
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>
        </View>

        {/* Date of Birth */}
        <View style={{width: '100%'}}>
          <Text style={styles.inputLabel}>Date of Birth</Text>
          <TouchableOpacity style={styles.dateInput} onPress={showDatepicker}>
            <Text style={styles.dateText}>{formatDate(dob)}</Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={dob}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        {/* Height */}
        <View style={{width: '100%'}}>
          <Text style={styles.inputLabel}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter height"
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />
        </View>

        {/* Weight */}
        <View style={{width: '100%'}}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter weight"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
        </View>

        {/* Buttons for Save Options */}
        <View style={{width: '100%', marginTop: 20}}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveAndAddAnother}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Save & Add Another</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSaveAndContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Save & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note about monitoring */}
        <View style={{marginTop: 20}}>
          <Text style={styles.noteText}>
            Angel Eyes will monitor your baby's routine, diet, and other activities
            to provide you with the best care recommendations.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#e6e6fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#512da8',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#673ab7',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#512da8',
    marginBottom: 8,
    marginLeft: 5,
  },
  input: {
    width: '100%',
    height: 55,
    borderColor: '#aaa',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  dateInput: {
    width: '100%',
    height: 55,
    borderColor: '#aaa',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    width: '100%',
    height: 55,
    borderColor: '#aaa',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  picker: {
    height: 55,
    width: '100%',
    color: '#333'
  },
  saveButton: {
    backgroundColor: '#6a1b9a',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 20,
    fontStyle: 'italic',
  }
});
