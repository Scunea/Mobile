import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider, BottomNavigation, Appbar, Portal, Dialog, Paragraph, Button, Modal, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import * as Updates from 'expo-updates';
import { User } from './interfaces';
import MaxModal from './MaxModal';
import Login from './Login';
import Schedule from './Schedule';
import Grades from './Grades';
import Messages from './Messages';
import Reports from './Reports';
import Activities from './Activities';
import Settings from './Settings';

const domain = process.env.DOMAIN;

export default function App() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'schedule', title: 'Schedule', focusedIcon: 'calendar' },
    { key: 'grades', title: 'Grades', focusedIcon: 'star' },
    { key: 'messages', title: 'Messages', focusedIcon: 'chat' },
    { key: 'reports', title: 'Reports', focusedIcon: 'file-document' },
    { key: 'activities', title: 'Activities', focusedIcon: 'pencil' },
  ]);
  const [settings, setSettings] = useState(false);
  const [ws, setWs] = useState<WebSocket>();
  const [websocketLost, setWebsocketLost] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
    if (await AsyncStorage.getItem("token") && await AsyncStorage.getItem("school")) {
      fetch(domain + '/info', {
        headers: new Headers({
          'Authorization': await AsyncStorage.getItem('token') ?? "",
          'School': await AsyncStorage.getItem('school') ?? ""
        })
      })
        .then(res => res.json()).then(async   json => {
          if (!json?.error) {
            setWs(connectWebsocket(await AsyncStorage.getItem('token') ?? '', await AsyncStorage.getItem('school') ?? ''));
            setUserInfo(json);
          } else {
            setError(json.error);
          }
        });
    }
  })();
  }, []);

  useEffect(() => {
    if (ws) {
      ws.addEventListener('message', (message: MessageEvent) => {
        if (message.data === 'Ping!') {
          ws.send('Pong!');
        } else {
          const data = JSON.parse(message.data);
          if (data.event === 'editedSchool') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                newUserInfo.schoolName = data.name;
                newUserInfo.schoolLogo = data.logo;
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'newGrades') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                newUserInfo.grades = data.grades;
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'newUser') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                newUserInfo.avaliable.push({
                  id: data.user.id,
                  name: data.user.name,
                  teacher: data.user.subject,
                  children: data.user.children,
                  type: data.user.type.split('').map((x: string, i: number) => i === 0 ? x.toUpperCase() : x).join('')
                });
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'editedUser') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                if(data.user.id === newUserInfo.id) {
                  newUserInfo.name = data.user.name;
                  newUserInfo.tfa = data.user.tfa;
                  newUserInfo.teacher = data.user.subject;
                } else {
                  const index = newUserInfo.avaliable.findIndex(x => x.id === data.user.id);
                  newUserInfo.avaliable[index].name = data.user.name;
                  newUserInfo.avaliable[index].teacher = data.user.subject;
                }
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          } else if (data.event === 'deletedUser') {
            setUserInfo(userInfo => {
              if (userInfo) {
                let newUserInfo = { ...userInfo };
                const index = newUserInfo.avaliable.findIndex(x => x.id === data.userId);
                if (index > -1) {
                  newUserInfo.avaliable.splice(index, 1);
                }
                return newUserInfo;
              } else {
                return userInfo;
              }
            })
          }
        }
      });
    }
  }, [ws]);

  function connectWebsocket(token: string, school: string) {
    const ws = new WebSocket('ws://' + domain?.split('://')[1] + '/socket?token=' + encodeURIComponent(token) + '&school=' + encodeURIComponent(school));

    ws.onopen = () => {
      console.info('[WebSocket] Connected.');
    };

    ws.onclose = () => {
      console.warn('[WebSocket] Disconnected.');
      setWebsocketLost(true);
    }

    setLoggedIn(true);
    return ws;
  }

  return (
    <PaperProvider theme={useColorScheme() === 'dark' ? MD3DarkTheme : MD3LightTheme}>
      <StatusBar style={useColorScheme() === 'dark' ? 'light' : 'dark'} />
      <Portal>
        <Dialog visible={websocketLost} onDismiss={() => setWebsocketLost(false)}>
            <Dialog.Title>WebSocket lost</Dialog.Title>
            <Dialog.Content>
              <Paragraph>We lost connection to the WebSocket. This will prevent automatically loading new posts. Would you like to restart the app to try to reconnect?</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => {
                setWebsocketLost(false);
              }}>Cancel</Button>
              <Button onPress={async () => {
                await Updates.reloadAsync()
              }}>Restart</Button>
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
        <Portal>
        <MaxModal visible={settings} onDismiss={() => setSettings(false)}>
          <Settings domain={domain} info={userInfo} ws={ws} setSettings={setSettings} />
          </MaxModal>
        </Portal>
      {loggedIn ? <>
        <Appbar.Header>
        <Appbar.Action icon={routes[index].focusedIcon} />
      <Appbar.Content title={routes[index].title} />
      <Appbar.Action icon="cog" onPress={() => {
        setSettings(true);
      }} />
    </Appbar.Header>
      <BottomNavigation navigationState={{index, routes}} onIndexChange={setIndex} renderScene={({ route }) => {
    switch (route.key) {
      case 'schedule': 
        return <Schedule domain={domain} info={userInfo} ws={ws} />;
      case 'grades':
        return <Grades domain={domain} info={userInfo} ws={ws} />
      case 'messages':
        return <Messages domain={domain} info={userInfo} ws={ws} />
      case 'reports':
        return <Reports domain={domain} info={userInfo} ws={ws} />
      case 'activities':
        return <Activities domain={domain} info={userInfo} ws={ws} />
    }
  }} />
      </> : <Login domain={domain} />}
    </PaperProvider>
  );
}