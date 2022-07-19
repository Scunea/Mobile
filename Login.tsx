import { useEffect, useState } from 'react';
import { ScrollView, View, FlatList } from 'react-native';
import { Button, Text, TextInput, Portal, Dialog, Paragraph, Appbar, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import Logo from './Logo';
import { School } from './interfaces';

export default function Login(props: { domain: string | undefined; }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [signUp, setSignUp] = useState(false);
  const [signedUp, setSignedUp] = useState(false);
  const [createSchool, setCreateSchool] = useState(false);
  const [invites, setInvites] = useState(false);
  const [token, setToken] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [pending, setPending] = useState<School[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
    if (await AsyncStorage.getItem('token')) {
        fetch(props.domain + '/loginbytoken', {
            method: 'POST',
            body: JSON.stringify({
                token: await AsyncStorage.getItem('token')
            }),
            headers: new Headers({
                'Content-Type': 'application/json'
            })
        })
            .then(res => res.json()).then(json => {
                if (json?.token) {
                    setToken(json.token);
                    setSchools(json.schools);
                    setPending(json.pendingschools);
                } else {
                  AsyncStorage.removeItem('token');
                }
            });
    }
  })();
}, []);

const { colors } = useTheme();

    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
    <Appbar.Header>
        {token || showOtp || signedUp ? <Appbar.BackAction onPress={() => {
            if (showOtp) {
                setShowOtp(false);
            } else if (createSchool) {
                setCreateSchool(false);
            } else if (invites) {
                setInvites(false);
            } else if(signedUp) {
              setSignedUp(false);
            } else {
                AsyncStorage.removeItem('token');
                setToken('');
            }
          }} /> : <Appbar.Action icon="login" />}
      <Appbar.Content title={!token ? !signUp ? 'Sign in' : 'Sign up' : invites ? 'Join a school' : createSchool ? 'Create a school' : 'Choose a school'} />
    </Appbar.Header>
        <Portal>
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
        {!token ? !signedUp ? <ScrollView contentContainerStyle={{ padding: 24 }}>
          <TextInput label="Email" autoCapitalize="none" autoComplete="email" disabled={showOtp} style={{ marginBottom: 10 }} value={email} onChangeText={text => setEmail(text)} />
        {signUp ? <TextInput label="Name" autoComplete="name" style={{ marginBottom: 10 }} value={name} onChangeText={text => setName(text)} /> : null}
        <TextInput label="Password" autoCapitalize="none" autoComplete={!signUp ? 'password' : 'password-new'} disabled={showOtp} secureTextEntry style={{ marginBottom: 10 }} value={password} onChangeText={text => setPassword(text)} />
        {showOtp ? <TextInput label="OTP" autoComplete="sms-otp" style={{ marginBottom: 10 }} value={otp} onChangeText={text => setOtp(text)} /> : null}
        {signUp ? <TextInput label="Confirm password" autoCapitalize="none" autoComplete="password-new" secureTextEntry style={{ marginBottom: 10 }} value={confirmPassword} onChangeText={text => setConfirmPassword(text)} /> : null}
        {!signUp ? <Button icon="arrow-right" disabled={!(email && password && (!showOtp || otp))} mode="contained" style={{ marginBottom: 4 }} onPress={() => {
          fetch(props.domain + '/login', {
              method: 'POST',
              body: JSON.stringify({
                  email: email,
                  password: password,
                  otp: otp
              }),
              headers: new Headers({
                  'Content-Type': 'application/json'
              })
          })
              .then(res => res.json()).then(async json => {
                  if (!json?.error) {
                      if (!json?.missingOtp) {
                          await AsyncStorage.setItem('token', json.token);
                          setName('');
                          setEmail('');
                          setPassword('');
                          setOtp('');
                          setToken(json.token);
                          setSchools(json.schools);
                          setPending(json.pendingschools);
                      } else {
                          setShowOtp(true);
                      }
                  } else {
                      setError(json.error);
                  }
              });
        }}>Next</Button> : <Button icon="login" disabled={!(email && name && password && (password === confirmPassword))} mode="contained" onPress={() => {
          fetch(props.domain + '/signup', {
              method: 'POST',
              body: JSON.stringify({
                  email: email,
                  name: name,
                  password: password
              }),
              headers: new Headers({
                  'Content-Type': 'application/json'
              })
          })
              .then(res => res.json()).then(json => {
                  if (!json?.error) {
                    setName('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                      setSignedUp(true);
                  } else {
                      setError(json.error);
                  }
              });
      }}>Sign up</Button>}
        <Button mode="text" onPress={() => {
          setShowOtp(false);
          setSignUp(!signUp);
        }}>{!signUp ? 'Sign up' : 'Sign in'}</Button>
        </ScrollView> : <Text>Your account has been created. Please verify your email to start using our service.</Text> : createSchool ? <>
          <TextInput label="Name" style={{ marginBottom: 10 }} value={name} onChangeText={text => setName(text)} />
          <Button icon="plus" mode="contained" onPress={async () => {
          fetch(props.domain + '/create', {
            method: 'POST',
            body: JSON.stringify({
                name: name,
            }),
            headers: new Headers({
                'Authorization': await AsyncStorage.getItem('token') ?? "",
                'Content-Type': 'application/json'
            })
        }).then(res => res.json()).then(async json => {
            if (!json?.error) {
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('school', json.id);
                await Updates.reloadAsync()
            } else {
                setError(json.error);
            }
        });
        }}>Create</Button>
        </> : invites ? pending.length > 0 ? <FlatList data={pending} keyExtractor={(item) => item.id} renderItem={({ item }) => <Button key={item.id} icon={item?.logo ? { uri: item.logo } : 'school'} onPress={async () => {
          fetch(props.domain + '/join/' + item.id, {
            method: 'POST',
            headers: new Headers({
                'Authorization': await AsyncStorage.getItem('token') ?? "",
            })
        }).then(res => res.json()).then(async json => {
            if (!json?.error) {
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('school', item.id);
                await Updates.reloadAsync()
            } else {
                setError(json.error);
            }
        });
        }}>{item.name}</Button>} /> : <Text>No invites available.</Text> : <>
        {<FlatList data={schools} keyExtractor={(item) => item.id} renderItem={({ item }) => <Button key={item.id} icon={item?.logo ? { uri: item.logo } : 'school'} style={{ margin: 8 }} onPress={async () => {
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('school', item.id);
          await Updates.reloadAsync()
        }}>{item.name}</Button>} />}
        <Button mode="contained" icon="plus" style={{ margin: 8 }} onPress={() => {
          setCreateSchool(true);
        }}>Create a school</Button>
        <Button mode="contained" icon="heart" style={{ margin: 8 }} onPress={() => {
          setInvites(true);
        }}>Invites</Button>
        </>}
      </View>
    );
  }