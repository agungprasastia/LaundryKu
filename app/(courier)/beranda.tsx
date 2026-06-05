import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function CourierBerandaScreen() {
  const { user } = useAuth();
  return (
    <View style={s.c}><View style={s.h}><Text style={s.hg}>Halo, {user?.full_name || 'Kurir'} 👋</Text><Text style={s.hs}>Selamat datang di LaundryKu Kurir</Text></View>
    <View style={s.ct}><View style={[s.ic, { backgroundColor: LaundryColors.roleKurirBg }]}><Ionicons name="bicycle" size={40} color={LaundryColors.roleKurirIcon} /></View><Text style={s.t}>Beranda Kurir</Text><Text style={s.st}>Fitur kurir akan segera hadir di phase selanjutnya.</Text></View></View>
  );
}
const s = StyleSheet.create({
  c:{flex:1,backgroundColor:LaundryColors.background},
  h:{backgroundColor:'#FFF',paddingTop:Platform.OS==='ios'?56:40,paddingBottom:16,paddingHorizontal:20,borderBottomWidth:1,borderBottomColor:LaundryColors.inputBorder},
  hg:{fontSize:18,fontWeight:'700',color:LaundryColors.textPrimary},
  hs:{fontSize:12,color:LaundryColors.textSecondary,marginTop:2},
  ct:{flex:1,alignItems:'center',justifyContent:'center',gap:12,paddingHorizontal:24},
  ic:{width:80,height:80,borderRadius:40,alignItems:'center',justifyContent:'center'},
  t:{fontSize:18,fontWeight:'700',color:LaundryColors.textPrimary},
  st:{fontSize:13,color:LaundryColors.textSecondary,textAlign:'center'},
});
