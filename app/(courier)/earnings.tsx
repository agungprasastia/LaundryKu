import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LaundryColors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
export default function CourierEarningsScreen() {
  return (<View style={s.c}><View style={s.h}><Text style={s.ht}>Pendapatan</Text></View><View style={s.ct}><Ionicons name="cash" size={48} color={LaundryColors.primaryLight} /><Text style={s.t}>Pendapatan Kurir</Text><Text style={s.st}>Fitur pendapatan akan segera hadir.</Text></View></View>);
}
const s = StyleSheet.create({c:{flex:1,backgroundColor:LaundryColors.background},h:{backgroundColor:'#FFF',paddingTop:Platform.OS==='ios'?56:40,paddingBottom:16,paddingHorizontal:20,borderBottomWidth:1,borderBottomColor:LaundryColors.inputBorder},ht:{fontSize:18,fontWeight:'700',color:LaundryColors.textPrimary},ct:{flex:1,alignItems:'center',justifyContent:'center',gap:8},t:{fontSize:18,fontWeight:'700',color:LaundryColors.textPrimary},st:{fontSize:13,color:LaundryColors.textSecondary,textAlign:'center',paddingHorizontal:24}});
