import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/api';

export default function CommunityScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // Sample community posts - replace with API calls
  const samplePosts = [
    {
      _id: '1',
      title: 'Sleep training tips for 6-month-old',
      content: 'My baby is 6 months old and still waking up multiple times during the night. Any advice on gentle sleep training methods?',
      author: {
        name: 'Sarah M.',
        initials: 'SM'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      replies: 12,
      likes: 8,
      category: 'Sleep'
    },
    {
      _id: '2',
      title: 'Introducing solid foods - need advice',
      content: 'When did you start introducing solid foods to your baby? My pediatrician says 6 months but some friends say earlier is okay.',
      author: {
        name: 'Mike D.',
        initials: 'MD'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      replies: 18,
      likes: 15,
      category: 'Feeding'
    },
    {
      _id: '3',
      title: 'Baby monitor recommendations',
      content: 'Looking for a reliable baby monitor with video. What are your favorites and why?',
      author: {
        name: 'Jennifer L.',
        initials: 'JL'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      replies: 7,
      likes: 12,
      category: 'Equipment'
    },
    {
      _id: '4',
      title: 'First time parent anxiety',
      content: 'Is it normal to feel overwhelmed as a first-time parent? Sometimes I worry about every little thing my baby does.',
      author: {
        name: 'Alex R.',
        initials: 'AR'
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
      replies: 25,
      likes: 32,
      category: 'Support'
    },
  ];

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await apiClient.getCommunityPosts();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setPosts(samplePosts);
    } catch (error) {
      console.error('Failed to load posts:', error);
      Alert.alert('Error', 'Failed to load community posts');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    try {
      // TODO: Replace with actual API call
      const newPost = {
        _id: Date.now().toString(),
        title: newPostTitle,
        content: newPostContent,
        author: {
          name: 'You',
          initials: 'YO'
        },
        timestamp: new Date(),
        replies: 0,
        likes: 0,
        category: 'General'
      };

      setPosts([newPost, ...posts]);
      setNewPostTitle('');
      setNewPostContent('');
      setShowNewPostModal(false);
      Alert.alert('Success', 'Your post has been created!');
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const handleLikePost = async (postId) => {
    try {
      const updatedPosts = posts.map(post => {
        if (post._id === postId) {
          return { ...post, likes: post.likes + 1 };
        }
        return post;
      });
      setPosts(updatedPosts);
      
      // TODO: Update on backend
      // await apiClient.likePost(postId);
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Sleep': return '#4D96FF';
      case 'Feeding': return '#FF6B6B';
      case 'Equipment': return '#6BCB77';
      case 'Support': return '#FFD93D';
      default: return '#9C27B0';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const renderPostItem = ({ item }) => (
    <TouchableOpacity
      style={styles.postCard}
      onPress={() => {
        // TODO: Navigate to post detail screen
        Alert.alert('Post Detail', `Open detailed view for: ${item.title}`);
      }}
    >
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <View style={styles.authorAvatar}>
            <Text style={styles.authorInitials}>{item.author.initials}</Text>
          </View>
          <View style={styles.postMeta}>
            <Text style={styles.authorName}>{item.author.name}</Text>
            <Text style={styles.postTime}>{formatTimestamp(item.timestamp)}</Text>
          </View>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>
        {item.content}
      </Text>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLikePost(item._id)}
        >
          <Ionicons name="heart-outline" size={18} color="#666" />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color="#666" />
          <Text style={styles.actionText}>{item.replies}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={18} color="#666" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6a1b9a" />
        <Text style={styles.loadingText}>Loading community...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#512da8" />
        </TouchableOpacity>
        <Text style={styles.title}>Community</Text>
        <TouchableOpacity 
          style={styles.newPostButton}
          onPress={() => setShowNewPostModal(true)}
        >
          <Ionicons name="add" size={24} color="#512da8" />
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={renderPostItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#6a1b9a']}
            tintColor="#6a1b9a"
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* New Post Modal */}
      <Modal
        visible={showNewPostModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowNewPostModal(false)}
            >
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity onPress={handleCreatePost}>
              <Text style={styles.postButton}>Post</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.titleInput}
              placeholder="Post title..."
              value={newPostTitle}
              onChangeText={setNewPostTitle}
              maxLength={100}
            />
            
            <TextInput
              style={styles.contentInput}
              placeholder="What's on your mind?"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
            
            <Text style={styles.characterCount}>
              {newPostContent.length}/500 characters
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0eef8',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  newPostButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#512da8',
  },
  listContainer: {
    padding: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#512da8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitials: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  postMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  postButton: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#512da8',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    padding: 0,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
});
