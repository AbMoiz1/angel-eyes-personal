import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  SafeAreaView,
  Alert,
  Image
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get babies data from route params
  const [babies, setBabies] = useState([]);
  const [selectedBaby, setSelectedBaby] = useState(null);

  // Dashboard modules with simple icons instead of image imports
  const modules = [
    { 
      id: 1, 
      title: 'Live Monitoring', 
      icon: "videocam-outline",
      color: '#FF6B6B' 
    },
    { 
      id: 2, 
      title: 'Track and Routine', 
      icon: "calendar-outline",
      color: '#4D96FF' 
    },
    { 
      id: 3, 
      title: 'Community', 
      icon: "people-outline",
      color: '#6BCB77' 
    },
    { 
      id: 4, 
      title: 'Detections', 
      icon: "alert-circle-outline",
      color: '#FFD93D' 
    }
  ];

  // Process babies data when it arrives from navigation
  useEffect(() => {
    if (params.babies) {
      try {
        // Parse the JSON string to get babies array
        const parsedBabies = JSON.parse(params.babies);
        
        // Process and convert ISO strings back to Date objects
        const processedBabies = parsedBabies.map(baby => ({
          ...baby,
          dob: new Date(baby.dob) // Convert ISO string back to Date object
        }));
        
        setBabies(processedBabies);
        
        // Set initially selected baby if available
        if (processedBabies.length > 0 && !selectedBaby) {
          setSelectedBaby(processedBabies[0]);
        }
      } catch (error) {
        console.error("Error parsing babies data:", error);
        Alert.alert("Error", "Could not load baby profiles");
      }
    }
  }, [params.babies]);

  // Handle baby selection
  const handleSelectBaby = (baby) => {
    setSelectedBaby(baby);
  };

  // Handle module press
  const handleModulePress = (module) => {
    Alert.alert(
      `${module.title}`,
      `Navigate to ${module.title} for ${selectedBaby?.name}`,
      [
        {
          text: 'OK',
          onPress: () => console.log(`Navigate to ${module.title} screen`)
        }
      ]
    );
  };

  // Calculate baby's age in weeks or months
  const calculateAge = (dob) => {
    if (!dob || !(dob instanceof Date)) {
      return 'Unknown';
    }
    
    const today = new Date();
    const birthDate = dob; // Already a Date object
    
    let ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
    ageInMonths -= birthDate.getMonth();
    ageInMonths += today.getMonth();
    
    if (ageInMonths < 1) {
      const ageInDays = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24));
      return `${ageInDays} days`;
    } else if (ageInMonths < 24) {
      return `${ageInMonths} months`;
    } else {
      const years = Math.floor(ageInMonths / 12);
      const remainingMonths = ageInMonths % 12;
      return remainingMonths > 0 ? `${years} years, ${remainingMonths} months` : `${years} years`;
    }
  };

  // Show add baby button if no babies exist
  if (babies.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <StatusBar barStyle="dark-content" />
        <Text style={styles.emptyTitle}>Welcome to Angel Eyes</Text>
        <Text style={styles.emptySubtitle}>No baby profiles yet</Text>
        <TouchableOpacity 
          style={styles.addBabyButton}
          onPress={() => router.push('/babyprofile')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addBabyText}>Add Baby Profile</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with welcome message */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.appName}>Angel Eyes</Text>
        </View>
      </View>

      {/* Baby selector */}
      <View style={{marginBottom: 15}}>
        <FlatList
          horizontal
          data={babies}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.babyListContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.babyCard,
                selectedBaby?.id === item.id && styles.selectedBabyCard
              ]}
              onPress={() => handleSelectBaby(item)}
            >
              <View style={styles.babyIconContainer}>
                <Ionicons 
                  name={item.gender === 'Male' ? "male" : "female"} 
                  size={24} 
                  color={item.gender === 'Male' ? "#4D96FF" : "#FF6B6B"} 
                />
              </View>
              <Text style={styles.babyName}>{item.name}</Text>
              <Text style={styles.babyAge}>{calculateAge(item.dob)}</Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addBabyCard}
              onPress={() => router.push('/babyprofile')}
            >
              <Ionicons name="add-circle-outline" size={28} color="#512da8" />
              <Text style={styles.addBabyCardText}>Add Baby</Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Dashboard modules */}
      <View style={{flex: 1, marginTop: 20}}>
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <View style={styles.modulesGrid}>
          {modules.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={styles.moduleCard}
              onPress={() => handleModulePress(module)}
            >
              <View style={[styles.moduleIconContainer, { backgroundColor: module.color }]}>
                <Ionicons name={module.icon} size={32} color="#fff" />
              </View>
              <Text style={styles.moduleTitle}>{module.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0eef8',
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f0eef8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#512da8',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  addBabyButton: {
    flexDirection: 'row',
    backgroundColor: '#6a1b9a',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addBabyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  welcomeContainer: {
    flexDirection: 'column',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#512da8',
  },
  settingsButton: {
    padding: 8,
  },
  babyListContainer: {
    paddingHorizontal: 5,
    paddingBottom: 10,
  },
  babyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    alignItems: 'center',
    width: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedBabyCard: {
    backgroundColor: '#e8e0ff',
    borderColor: '#512da8',
    borderWidth: 2,
  },
  addBabyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#512da8',
  },
  addBabyCardText: {
    color: '#512da8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  babyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0eef8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  babyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  babyAge: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#512da8',
    marginBottom: 20,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    height: 160,
    justifyContent: 'center',
  },
  moduleIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});
