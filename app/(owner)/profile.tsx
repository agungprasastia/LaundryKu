import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { crossAlert } from '@/utils/crossAlert';
import { useRouter } from 'expo-router';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function OwnerProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const handleLogout = () => {
    crossAlert('Logout', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };
  return (
    <View style={s.c}>
      <View style={s.h}><Text style={s.ht}>Profil</Text></View>
      <View style={s.ct}>
        <View style={s.av}><Ionicons name="person" size={36} color="#FFF" /></View>
        <Text style={s.n}>{user?.full_name || 'Mitra'}</Text>
        <Text style={s.e}>{user?.email || '-'}</Text>
        <View style={[s.rb, { backgroundColor: LaundryColors.roleMitraBg }]}>
          <Text style={[s.rbt, { color: LaundryColors.roleMitraIcon }]}>Mitra Laundry</Text>
        </View>
        <TouchableOpacity style={s.lb} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={LaundryColors.error} />
          <Text style={s.lt}>Keluar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  c:{flex:1,backgroundColor:LaundryColors.background},
  h:{backgroundColor:'#FFF',paddingTop:Platform.OS==='ios'?56:40,paddingBottom:16,paddingHorizontal:20,borderBottomWidth:1,borderBottomColor:LaundryColors.inputBorder},
  ht:{fontSize:18,fontWeight:'700',color:LaundryColors.textPrimary},
  ct:{flex:1,alignItems:'center',justifyContent:'center',gap:12,paddingHorizontal:24},
  av:{width:72,height:72,borderRadius:36,backgroundColor:LaundryColors.roleMitraIcon,alignItems:'center',justifyContent:'center'},
  n:{fontSize:18,fontWeight:'700',color:LaundryColors.textPrimary},
  e:{fontSize:13,color:LaundryColors.textSecondary},
  rb:{paddingHorizontal:14,paddingVertical:5,borderRadius:8},
  rbt:{fontSize:12,fontWeight:'700'},
  lb:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#FEF2F2',borderRadius:14,height:50,gap:8,borderWidth:1,borderColor:'#FECACA',width:'100%',marginTop:20},
  lt:{fontSize:15,fontWeight:'700',color:LaundryColors.error},
});
