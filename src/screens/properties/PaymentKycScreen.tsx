import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { colors, fonts } from '../../constants';
import { Property } from '../../types/property.types';
import { User } from '../../types/user.types';
import { firestoreService } from '../../services/firestore';
import { createLinkedAccount, updateLinkedAccountSettlements } from '../../services/api/paymentApi';

interface PaymentKycScreenProps {
  navigation: any;
  route: { params?: { property?: Property } };
}

const PaymentKycScreen: React.FC<PaymentKycScreenProps> = ({ navigation, route }) => {
  const property = route?.params?.property as Property | undefined;
  
  const [owner, setOwner] = useState<User | null>(null);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [email, setEmail] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const linkedAccountId = property?.payments?.linkedAccountId;

  // Load owner details from users collection
  useEffect(() => {
    const loadOwnerDetails = async () => {
      if (!property?.ownerId) {
        setInitialLoading(false);
        return;
      }

      try {
        // Get owner name from property collection
        setOwnerName(property.ownerName || '');
        setOwnerPhone(property.ownerPhone || '');
        setBeneficiaryName(property.ownerName || '');

        // Get owner email from users collection
        console.log('Fetching user profile for ownerId:', property.ownerId);
        const ownerData = await firestoreService.getUserProfile(property.ownerId);
        console.log('Owner data from users collection:', ownerData);
        
        if (ownerData) {
          setOwner(ownerData);
          setEmail(ownerData.email || '');
          console.log('Set email to:', ownerData.email);
        } else {
          console.log('No owner data found for ownerId:', property.ownerId);
        }
      } catch (error) {
        console.error('Error loading owner details:', error);
        Alert.alert('Error', 'Failed to load owner details');
      } finally {
        setInitialLoading(false);
      }
    };

    loadOwnerDetails();
  }, [property?.ownerId, property?.ownerName, property?.ownerPhone]);

  const onSubmit = async () => {
    try {
      if (!property) return;
      if (!email) {
        Alert.alert('Missing', 'Please provide email');
        return;
      }
      setLoading(true);
      
      // Update user profile in users collection with new email
      if (property.ownerId && email) {
        await firestoreService.updateUserProfile(property.ownerId, {
          email: email,
        });
      }
      
      // Persist editable owner contact fields to the property
      await firestoreService.updateProperty(property.id, {
        ownerName: ownerName,
        ownerPhone: ownerPhone,
        contactInfo: {
          ...(property.contactInfo || {}),
          managerEmail: email,
        },
      });
      let accountId = linkedAccountId;
      if (!accountId) {
        const created = await createLinkedAccount({
          name: ownerName || 'Property Owner',
          email,
          contact: ownerPhone || '9999999999',
          address: { city: property?.location?.city || 'NA', state: property?.location?.state || 'NA', postal_code: property?.location?.postalCode || '000000', country: 'IN' }
        });
        accountId = created.linkedAccountId;
        await firestoreService.updatePropertyPayments(property.id, { enabled: true, linkedAccountId: accountId });
      }
      if (accountId && beneficiaryName && accountNumber && ifsc) {
        await updateLinkedAccountSettlements({ accountId, beneficiary_name: beneficiaryName, account_number: accountNumber, ifsc_code: ifsc });
      }
      Alert.alert('Success', 'Payment details saved');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save payment details');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Payment KYC</Text>
        <Text style={styles.subtitle}>Loading owner details...</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Payment KYC</Text>
      <Text style={styles.subtitle}>Owner details - name from property, email editable</Text>

      <Text style={styles.label}>Owner Name</Text>
      <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} />

      <Text style={styles.label}>Owner Phone</Text>
      <TextInput style={styles.input} value={ownerPhone} onChangeText={setOwnerPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>Owner Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      <View style={styles.divider} />
      <Text style={styles.subtitle}>Settlement Bank Details</Text>

      <Text style={styles.label}>Beneficiary Name</Text>
      <TextInput style={styles.input} value={beneficiaryName} onChangeText={setBeneficiaryName} />

      <Text style={styles.label}>Account Number</Text>
      <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />

      <Text style={styles.label}>IFSC</Text>
      <TextInput style={styles.input} value={ifsc} onChangeText={setIfsc} autoCapitalize="characters" />

      <TouchableOpacity disabled={loading} onPress={onSubmit} style={[styles.button, loading && { opacity: 0.7 }]}> 
        <Text style={styles.buttonText}>{linkedAccountId ? 'Update' : 'Create'} Linked Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontFamily: fonts.bold, color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textMuted, marginBottom: 12 },
  label: { fontSize: 13, color: colors.textPrimary, marginTop: 10, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 16 },
  button: { backgroundColor: colors.primary, padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  buttonText: { color: 'white', fontFamily: fonts.bold, fontSize: 16 }
});

export default PaymentKycScreen;


