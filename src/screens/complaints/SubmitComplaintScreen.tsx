import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, fonts, dimensions } from '../../constants';
import { 
  ComplaintCategory, 
  ComplaintType, 
  ComplaintPriority,
  CreateComplaintData,
  COMPLAINT_TEMPLATES 
} from '../../types/complaint.types';
import { useComplaints } from '../../hooks/useComplaints';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../hooks/useProperties';
import { useTenants } from '../../hooks/useTenants';

interface SubmitComplaintScreenProps {
  navigation: any;
  route: any;
}

const SubmitComplaintScreen: React.FC<SubmitComplaintScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const { createComplaint, loading } = useComplaints();
  const { properties } = useProperties();
  const { tenants } = useTenants();
  
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [type, setType] = useState<ComplaintType | null>(null);
  const [priority, setPriority] = useState<ComplaintPriority>(ComplaintPriority.MEDIUM);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [images, setImages] = useState<string[]>([]);

  // Get tenant's property and room
  useEffect(() => {
    if (user && tenants.length > 0) {
      const tenant = tenants.find(t => t.userId === user.uid);
      if (tenant) {
        const property = properties.find(p => p.id === tenant.propertyId);
        if (property) {
          setSelectedProperty(property);
          setSelectedRoom({ id: tenant.roomId, roomNumber: tenant.roomId });
        }
      }
    }
  }, [user, tenants, properties]);

  // Handle template selection
  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setType(template.type);
    setPriority(template.priority);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedProperty || !selectedRoom || !category || !type) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please provide a title and description');
      return;
    }

    try {
      const complaintData: CreateComplaintData = {
        tenantId: user?.uid || '',
        propertyId: selectedProperty.id,
        roomId: selectedRoom.id,
        title: title.trim(),
        description: description.trim(),
        category,
        type,
        priority,
      };

      const complaintId = await createComplaint(complaintData);
      
      if (complaintId) {
        Alert.alert(
          'Success',
          'Your complaint has been submitted successfully. We will address it soon.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit complaint');
    }
  };

  // Get category color
  const getCategoryColor = (cat: ComplaintCategory) => {
    const colors = {
      [ComplaintCategory.ELECTRICAL]: '#FF6B6B',
      [ComplaintCategory.PLUMBING]: '#4ECDC4',
      [ComplaintCategory.WATER]: '#45B7D1',
      [ComplaintCategory.CLEANING]: '#96CEB4',
      [ComplaintCategory.SECURITY]: '#FFEAA7',
      [ComplaintCategory.INTERNET]: '#DDA0DD',
      [ComplaintCategory.HVAC]: '#98D8C8',
      [ComplaintCategory.FURNITURE]: '#F7DC6F',
      [ComplaintCategory.STRUCTURAL]: '#BB8FCE',
      [ComplaintCategory.NOISE]: '#85C1E9',
      [ComplaintCategory.OTHER]: '#A9A9A9',
    };
    return colors[cat] || '#A9A9A9';
  };

  // Get priority color
  const getPriorityColor = (pri: ComplaintPriority) => {
    const priorityColors = {
      [ComplaintPriority.LOW]: colors.success,
      [ComplaintPriority.MEDIUM]: colors.warning,
      [ComplaintPriority.HIGH]: colors.error,
      [ComplaintPriority.URGENT]: '#FF0000',
      [ComplaintPriority.CRITICAL]: '#8B0000',
    };
    return priorityColors[pri] || colors.warning;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Complaint</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Report</Text>
          <Text style={styles.sectionSubtitle}>Select a common issue to quickly fill the form</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesContainer}>
            {COMPLAINT_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  selectedTemplate?.id === template.id && styles.templateCardSelected,
                  { borderLeftColor: getCategoryColor(template.category) }
                ]}
                onPress={() => handleTemplateSelect(template)}
              >
                <Text style={styles.templateTitle}>{template.title}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(template.priority) }]}>
                  <Text style={styles.priorityText}>{template.priority.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Property Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Property:</Text>
              <Text style={styles.infoValue}>{selectedProperty?.name || 'Loading...'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Room:</Text>
              <Text style={styles.infoValue}>{selectedRoom?.roomNumber || 'Loading...'}</Text>
            </View>
          </View>
        </View>

        {/* Complaint Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complaint Details</Text>
          
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief description of the issue"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Please provide detailed information about the issue"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
              {Object.values(ComplaintCategory).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat && styles.categoryChipSelected,
                    { borderColor: getCategoryColor(cat) }
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextSelected,
                    { color: category === cat ? getCategoryColor(cat) : colors.textSecondary }
                  ]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type *</Text>
            <View style={styles.typeContainer}>
              {Object.values(ComplaintType).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeChip,
                    type === t && styles.typeChipSelected
                  ]}
                  onPress={() => setType(t)}
                >
                  <Text style={[
                    styles.typeText,
                    type === t && styles.typeTextSelected
                  ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityContainer}>
              {Object.values(ComplaintPriority).map((pri) => (
                <TouchableOpacity
                  key={pri}
                  style={[
                    styles.priorityChip,
                    priority === pri && styles.priorityChipSelected,
                    { borderColor: getPriorityColor(pri) }
                  ]}
                  onPress={() => setPriority(pri)}
                >
                  <Text style={[
                    styles.priorityText,
                    priority === pri && styles.priorityTextSelected,
                    { color: priority === pri ? getPriorityColor(pri) : colors.textSecondary }
                  ]}>
                    {pri.charAt(0).toUpperCase() + pri.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Complaint</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    height: 56,
  },
  backButton: {
    marginRight: dimensions.spacing.md,
  },
  backIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.spacing.lg,
  },
  section: {
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: fonts.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.md,
  },
  templatesContainer: {
    marginBottom: dimensions.spacing.md,
  },
  templateCard: {
    backgroundColor: colors.white,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginRight: dimensions.spacing.sm,
    width: 200,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  templateCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  templateTitle: {
    fontSize: fonts.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  templateDescription: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.sm,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    color: colors.white,
    fontSize: fonts.xs,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  infoLabel: {
    fontSize: fonts.md,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: dimensions.spacing.lg,
  },
  inputLabel: {
    fontSize: fonts.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    fontSize: fonts.md,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    marginBottom: dimensions.spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
    marginRight: dimensions.spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  categoryText: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.sm,
  },
  typeChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    fontSize: fonts.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  typeTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dimensions.spacing.sm,
  },
  priorityChip: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGray,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: 20,
  },
  priorityChipSelected: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center',
    marginTop: dimensions.spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: fonts.md,
    fontWeight: '600',
  },
});

export default SubmitComplaintScreen;

