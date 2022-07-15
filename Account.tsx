import { useEffect, useState } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { Button, TextInput, FAB, Portal, Dialog, Paragraph, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { OTP, User } from './interfaces';

export default function Account(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showSignOutDialog, setShowSignOutDialog] = useState(false);
    const [showTfaDialog, setShowTfaDialog] = useState(false);
    const [otpInfo, setOtpInfo] = useState<OTP>();
    const [error, setError] = useState('');
    const [name, setName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [otp, setOtp] = useState('');

    useEffect(() => {
        setName(props.info?.name ?? '');
    }, []);

    useEffect(() => {
        (async () => {
        if (showTfaDialog) {
          fetch(props.domain + '/otp', {
            method: 'POST',
            headers: new Headers({
              'Authorization': await AsyncStorage.getItem('token') ?? "",
              'School': await AsyncStorage.getItem('school') ?? "",
            })
          }).then(res => res.json()).then(json => {
            if (!json?.error) {
              setOtpInfo(json);
            }
          });
        }
    })();
      }, [showTfaDialog]);
    
    return (
        <View style={{ flex: 1 }}>
            <Portal>
          <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
            <Dialog.Title>Delete your account?</Dialog.Title>
            <Dialog.Content>
              <Paragraph style={{ marginBottom: 8 }}>Public data will be kept.</Paragraph>
              <TextInput label="Current password" secureTextEntry autoCapitalize="none" autoComplete="password" value={currentPassword} onChangeText={text => setCurrentPassword(text)} />
              {props.info?.tfa ? <TextInput label="OTP" value={otp} onChangeText={text => setOtp(text)} /> : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => {
                setShowDeleteDialog(false);
                setCurrentPassword('');
                setOtp('');
              }}>Cancel</Button>
            <Button disabled={!currentPassword || !(otp || !props.info?.tfa)} onPress={async () => {
                fetch(props.domain + '/account', {
                    method: 'DELETE',
                    body: JSON.stringify({
                      password: currentPassword,
                      otp: otp
                    }),
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                    })
                }).then(res => res.json()).then(async json => {
                    setShowDeleteDialog(false);
                    if (!json?.error) {
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('school');
                        await Updates.reloadAsync()
                    } else {
                        setError(json.error);
                    }
                });
            }}>Delete</Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={showSignOutDialog} onDismiss={() => setShowSignOutDialog(false)}>
            <Dialog.Title>Sign out?</Dialog.Title>
            <Dialog.Actions>
              <Button onPress={() => setShowSignOutDialog(false)}>Cancel</Button>
            <Button onPress={async () => {
               await AsyncStorage.removeItem('token');
               await AsyncStorage.removeItem('school');
               await Updates.reloadAsync()
            }}>Sign out</Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={showTfaDialog} onDismiss={() => setShowTfaDialog(false)}>
            <Dialog.Title>{!props.info?.tfa ? 'Set up 2FA' : 'Remove 2FA'}</Dialog.Title>
            <Dialog.Content>
              {!props.info?.tfa ? <>
              <Image source={{ uri: otpInfo?.qr }} style={{ width: 166, height: 166, alignSelf: 'center', marginBottom: 8 }} />
              <Text selectable>{otpInfo?.secret}</Text>
              </> : null}
              <TextInput label="Current password" secureTextEntry autoCapitalize="none" autoComplete="password" value={currentPassword} onChangeText={text => setCurrentPassword(text)} />
              <TextInput label="OTP" value={otp} onChangeText={text => setOtp(text)} />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => {
                setShowTfaDialog(false);
                setCurrentPassword('');
                setOtp('');
              }}>Cancel</Button>
            <Button disabled={!currentPassword ||! otp} onPress={async () => {
                if(!props.info?.tfa) {
                 fetch(props.domain + '/otp/' + otpInfo?.secret, {
                    method: 'POST',
                    body: JSON.stringify({
                      password: currentPassword,
                      otp: otp
                    }),
                    headers: new Headers({
                      'Authorization': await AsyncStorage.getItem('token') ?? "",
                      'School': await AsyncStorage.getItem('school') ?? "",
                      'Content-Type': 'application/json'
                    })
                  }).then(res => res.json()).then(json => {
                    if (!json?.error) {
                      setShowTfaDialog(false);
                      setCurrentPassword('');
                      setOtp('');
                    }
                  });
                } else {
                    fetch(props.domain + '/otp', {
                        method: 'DELETE',
                        body: JSON.stringify({
                          password: currentPassword,
                          otp: otp
                        }),
                        headers: new Headers({
                          'Authorization': await AsyncStorage.getItem('token') ?? "",
                          'School': await AsyncStorage.getItem('school') ?? "",
                          'Content-Type': 'application/json'
                        })
                      }).then(res => res.json()).then(json => {
                        if (!json?.error) {
                          setShowTfaDialog(false);
                          setCurrentPassword('');
                          setOtp('');
                        }
                      });
                }
            }}>{!props.info?.tfa ? 'Set up 2FA' : 'Remove 2FA'}</Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={showSaveDialog} onDismiss={() => setShowSaveDialog(false)}>
            <Dialog.Title>Save changes?</Dialog.Title>
            <Dialog.Content>
              <TextInput label="Current password" secureTextEntry autoCapitalize="none" autoComplete="password" value={currentPassword} onChangeText={text => setCurrentPassword(text)} />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => {
                setShowSaveDialog(false);
                setCurrentPassword('');
              }}>Cancel</Button>
            <Button disabled={!currentPassword} onPress={async () => {
                fetch(props.domain + '/account', {
                    method: 'PATCH',
                    body: JSON.stringify({
                      name: name,
                      password: newPassword,
                      currentPassword: currentPassword
                    }),
                    headers: new Headers({
                      'Authorization': await AsyncStorage.getItem('token') ?? "",
                      'School': await AsyncStorage.getItem('school') ?? "",
                      'Content-Type': 'application/json'
                    })
                  }).then(res => res.json()).then(json => {
                    if (!json?.error) {
                      setShowSaveDialog(false);
                      setCurrentPassword('');
                      setName('');
                      setNewPassword('');
                    }
                  });
            }}>Save</Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={!!error} onDismiss={() => setError('')}>
            <Dialog.Title>Error</Dialog.Title>
            <Dialog.Content>
              <Paragraph>{error}</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setError('')}>OK</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
            <ScrollView style={{ margin: 16 }}>
            <TextInput label="Name" autoComplete="name" value={name} onChangeText={text => setName(text)} />
            <TextInput label="New password" secureTextEntry autoCapitalize="none" autoComplete="password-new" value={newPassword} onChangeText={text => setNewPassword(text)} />
            
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
                <Button icon="lock" mode="outlined" style={{ marginRight: 'auto' }} onPress={() => setShowTfaDialog(true)}>{!props.info?.tfa ? 'Set up 2FA' : 'Remove 2FA'}</Button>
                <Button icon="delete" mode="contained" onPress={() => setShowDeleteDialog(true)}>Delete account</Button>
            </View>
            <Button icon="logout" mode="contained" style={{ marginTop: 16 }} onPress={() => setShowSignOutDialog(true)}>Sign out</Button>
            </ScrollView>
            <FAB label="Save" icon="floppy" disabled={!name && !newPassword} style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }} onPress={() => setShowSaveDialog(true)} />
        </View>
    );
  }