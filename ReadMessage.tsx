import { createRef, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ScrollView, View, Linking, useWindowDimensions } from 'react-native';
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appbar, Portal, Dialog, Divider, Text, useTheme, Paragraph, Button, List } from 'react-native-paper';
import RenderHtml from 'react-native-render-html';
import Pdf from 'react-native-pdf';
import { Message, User } from './interfaces';

export default function ReadMessage(props: { domain: string | undefined; messages: Message[]; selectedMessage: Message | null; setSelectedMessage: (value: React.SetStateAction<Message | null>) => void; setSelectedEditMessage: Dispatch<Message | null>; info: User | null; }) {
  const viewShotContent = createRef<ViewShot>();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExtraInfo, setShowExtraInfo] = useState(false);
    const [error, setError] = useState('');
    
    const { colors } = useTheme();

    const { width } = useWindowDimensions();

    useEffect(() => {
        setTimeout(() => {
          if(showExtraInfo && viewShotContent.current?.capture) {
        viewShotContent.current.capture().then(async uri => {
          setShowExtraInfo(false);
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            UTI: 'public.image'
          });
        });
      }
      }, 0);
    }, [showExtraInfo]);
    
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Portal>
          <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
            <Dialog.Title>Delete message?</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Do you want to delete this message?</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={async () => {
                fetch(props.domain + '/messages/' + props.selectedMessage?.id, {
                    method: 'DELETE',
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                    })
                }).then(res => res.json()).then(json => {
                    setShowDeleteDialog(false);
                    if (!json?.error) {
                        props.setSelectedMessage(null);
                    } else {
                        setError(json.error);
                    }
                });
            }}>Delete</Button>
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
            <Appbar.Header>
            <Appbar.BackAction onPress={() => props.setSelectedMessage(null)} />
      <Appbar.Content title={props.selectedMessage?.title} />
      {props.selectedMessage?.author.id === props.info?.id || props.info?.administrator ? <>
      <Appbar.Action icon="pencil" onPress={() => {
        props.setSelectedEditMessage(props.selectedMessage);
        props.setSelectedMessage(null);
    }} />
      <Appbar.Action icon="delete" onPress={() => {
        setShowDeleteDialog(true);
      }} />
      </> : null}
      <Appbar.Action icon="share-variant" onPress={() => {
        if(viewShotContent.current?.capture) {
          setShowExtraInfo(true);
    }
      }} />
    </Appbar.Header>
    <View style={{ padding: 24 }}>
      <Text>{props.selectedMessage?.receiver ? 'From ' + props.selectedMessage?.author.name + ' to ' + props.selectedMessage?.receiver.map(x => x.name).join(', ') : 'From ' + props.selectedMessage?.author.name}</Text>
      <Text style={{ color: colors.primary }}>{new Date(props.selectedMessage?.date ?? 0).toString()}</Text>
      {(props.selectedMessage?.files?.length ?? 0) > 0 ? <List.Accordion
        title="Files"
        left={props => <List.Icon {...props} icon="file" />}>
        {props.selectedMessage?.files.map(file => <List.Item key={file.id} title={file.name} onPress={() => {
          Linking.openURL(props.domain + '/static/' + file.id + '?name=' + file.name);
        }} />)}
      </List.Accordion> : null}
    </View>
    <Divider />
    {!props.selectedMessage?.pdf ? <ScrollView>
      <ViewShot ref={viewShotContent}>
        <View style={{ padding: 24, backgroundColor: colors.background }}>
  {showExtraInfo ? <View>
        <Text variant="titleLarge">{props.selectedMessage?.title}</Text>
    <View>
      <Text>{props.selectedMessage?.receiver ? 'From ' + props.selectedMessage?.author.name + ' to ' + props.selectedMessage?.receiver.map(x => x.name).join(', ') : 'From ' + props.selectedMessage?.author.name}</Text>
      <Text style={{ color: colors.primary }}>{new Date(props.selectedMessage?.date ?? 0).toString()}</Text>
      {(props.selectedMessage?.files?.length ?? 0) > 0 ? <List.Accordion
        expanded
        title="Files"
        left={props => <List.Icon {...props} icon="file" />}>
        {props.selectedMessage?.files.map(file => <List.Item key={file.id} title={file.name} />)}
      </List.Accordion> : null}
    </View>
    <Divider />
    </View> : null}
            <RenderHtml contentWidth={width} source={{ html: props.selectedMessage?.content ?? '' }} />
        </View>
        </ViewShot>
    </ScrollView> : <ViewShot ref={viewShotContent} style={{ flex: 1 }}>
    {showExtraInfo ? <View style={{ padding: 24, backgroundColor: colors.background }}>
        <Text variant="titleLarge">{props.selectedMessage?.title}</Text>
    <View>
      <Text>{props.selectedMessage?.receiver ? 'From ' + props.selectedMessage?.author.name + ' to ' + props.selectedMessage?.receiver.map(x => x.name).join(', ') : 'From ' + props.selectedMessage?.author.name}</Text>
      <Text style={{ color: colors.primary }}>{new Date(props.selectedMessage?.date ?? 0).toString()}</Text>
      {(props.selectedMessage?.files?.length ?? 0) > 0 ? <List.Accordion
        expanded
        title="Files"
        left={props => <List.Icon {...props} icon="file" />}>
        {props.selectedMessage?.files.map(file => <List.Item key={file.id} title={file.name} />)}
      </List.Accordion> : null}
    </View>
    <Divider />
    </View> : null}
      <Pdf source={{ uri: props.domain + '/static/' + props.selectedMessage?.pdf }} trustAllCerts={false} style={{ flex: 1 }} />
      </ViewShot>}
        </View>
    );
  }