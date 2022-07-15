import { createRef, Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilePicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util'
import * as FileSystem from 'expo-file-system';
import { Appbar, TextInput, Portal, useTheme, List, Dialog, Button, Paragraph } from 'react-native-paper';
import Pdf from 'react-native-pdf';
import MaxModal from './MaxModal';
import Receivers from './Receivers';
import CKEditor from './CKEditor';
import { IdPlusUrl, File, User, Message, IdPlusName } from './interfaces';
import WebView from 'react-native-webview';

export default function EditMessgae(props: { domain: string | undefined; setSelectedMessage: Dispatch<SetStateAction<Message | null>>; selectedEditMessage: Message | null; setSelectedEditMessage: Dispatch<SetStateAction<Message | null>>; info: User | null; }) {
    const webView = createRef<WebView>();
    
    const [token, setToken] = useState('');
    const [school, setSchool] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showReceiversDialog, setShowReceiversDialog] = useState(false);
    const [receiver, setReceiver] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [oldFiles, setOldFiles] = useState<IdPlusName[]>([]);
    const [pdf, setPdf] = useState<string | null>('');
    const [error, setError] = useState('');

    useEffect(() => {
        setReceiver(props.selectedEditMessage?.receiver.map(x => x.id) ?? []);
        setTitle(props.selectedEditMessage?.title ?? '');
        setContent(props.selectedEditMessage?.content ?? '');
        setPdf(props.selectedEditMessage?.pdf ?? null);
        setOldFiles(props.selectedEditMessage?.files ?? []);

        (async () => {
            setToken(await AsyncStorage.getItem('token') ?? '');
            setSchool(await AsyncStorage.getItem('school') ?? '');
        })();
    }, []);
    
    const { colors } = useTheme();
    
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Portal>
        <MaxModal visible={showReceiversDialog} dismissable={false}>
          <Receivers info={props.info} receiver={receiver} setReceiver={setReceiver} setShowReceiversDialog={setShowReceiversDialog} />
          </MaxModal>
          <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
            <Dialog.Title>Delete message?</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Do you want to delete this message?</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={async () => {
                fetch(props.domain + '/messages/' + props.selectedEditMessage?.id, {
                    method: 'DELETE',
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                    })
                }).then(res => res.json()).then(json => {
                    setShowDeleteDialog(false);
                    if (!json?.error) {
                        props.setSelectedEditMessage(null);
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
            <Appbar.BackAction onPress={() => {
                props.setSelectedMessage(props.selectedEditMessage);
                props.setSelectedEditMessage(null);
            }} />
      <Appbar.Content title="Edit message" />
      <Appbar.Action icon="attachment" onPress={() => {
        FilePicker.pick({
            allowMultiSelection: true,
            copyTo: 'cachesDirectory'
        }).then((response) => {
            response.forEach(file => {
                if(file.fileCopyUri) {
                    FileSystem.readAsStringAsync(file.fileCopyUri, {
                        encoding: FileSystem.EncodingType.Base64
                    }).then(data => {
                       setFiles(files => {
                        let newFiles = [...files];
                        newFiles.push({
                            name: 'upload',
                            filename: file.name,
                            type: file.type ?? '',
                            data: data
                        });
                        return newFiles;
                    });
            });
        }
        });
    });
      }} />
      <Appbar.Action icon="delete" onPress={() => {
        setShowDeleteDialog(true);
      }} />
      <Appbar.Action icon="floppy" disabled={(!(title?.length > 0)) || (!(content?.length > 0) && !props.selectedEditMessage?.pdf) || (!(receiver.length > 0))} onPress={async () => { 
                                if (files.length > 0) {
                                    ReactNativeBlobUtil.fetch('POST', props.domain + '/upload', {
                                            'Authorization': await AsyncStorage.getItem('token') ?? "",
                                            'School': await AsyncStorage.getItem('school') ?? "",
                                            'Content-Type' : 'multipart/form-data'
                                        }, files).then(res => res.json()).then(async json => {
                                        if (!json?.error) {
                                            const filesIds = (json as IdPlusUrl[]).map(x => x.id);
                                            fetch(props.domain + '/messages/' + props.selectedEditMessage?.id, {
                                                method: 'PATCH',
                                                body: JSON.stringify({
                                                    title: title,
                                                    content: !pdf ? content : null,
                                                    files: oldFiles.concat(filesIds.map((x, i) => { return { id: x, name: files[i].filename }; })),
                                                    receiver: receiver
                                                }),
                                                headers: new Headers({
                                                    'Authorization': await AsyncStorage.getItem('token') ?? "",
                                                    'School': await AsyncStorage.getItem('school') ?? "",
                                                    'Content-Type': 'application/json'
                                                })
                                            })
                                                .then(res => res.json()).then(json => {
                                                    if (!json?.error) {
                                                        setTitle('');
                                                        setContent('');
                                                        setPdf(null);
                                                        setReceiver([]);
                                                        setFiles([]);
                                                        props.setSelectedMessage(props.selectedEditMessage);
                                                        props.setSelectedEditMessage(null);
                                                    } else {
                                                        setError(json.error);
                                                    }
                                                });
                                        } else {
                                            setError(json.error);
                                        }
                                    });
                                } else {
                                    fetch(props.domain + '/messages/' + props.selectedEditMessage?.id, {
                                        method: 'PATCH',
                                        body: JSON.stringify({
                                            title: title,
                                            content: content,
                                            receiver: receiver
                                        }),
                                        headers: new Headers({
                                            'Authorization': await AsyncStorage.getItem('token') ?? "",
                                            'School': await AsyncStorage.getItem('school') ?? "",
                                            'Content-Type': 'application/json'
                                        })
                                    })
                                        .then(res => res.json()).then(json => {
                                            if (!json?.error) {
                                                setTitle('');
                                                setContent('');
                                                setPdf(null);
                                                setReceiver([]);
                                                setFiles([]);
                                                props.setSelectedMessage(props.selectedEditMessage);
                                                props.setSelectedEditMessage(null);
                                            }
                                        });
                                }

                            }} />
    </Appbar.Header>
    <ScrollView contentContainerStyle={{ flex: 1 }}>
        <Pressable onPress={() => setShowReceiversDialog(true)}>
            <TextInput label="Receivers" value={props.info?.avaliable.filter(x => receiver.includes(x.id)).map(x => x.name).join(', ')} mode="outlined" editable={false} />
        </Pressable>
        <TextInput label="Title" mode="outlined" value={title} onChangeText={text => setTitle(text)} />
        {oldFiles.map(x => x.name).concat(files.map(x => x.filename)).length > 0 ? <List.Accordion
        title="Files"
        left={props => <List.Icon {...props} icon="file" />}>
            {oldFiles.map((file, i) => <List.Item key={i} title={file.name} onPress={() => {
          setOldFiles(oldFiles => {
            let newOldFiles = [...oldFiles];
            newOldFiles.splice(i, 1);
            return newOldFiles;
          });
        }} />)}
        {files.map((file, i) => <List.Item key={i} title={file.filename} onPress={() => {
          setFiles(files => {
            let newFiles = [...files];
            newFiles.splice(i, 1);
            return newFiles;
          });
        }} />)}
        </List.Accordion> : null}
        {!pdf ? token && school ? <WebView ref={webView} source={{ html: CKEditor }} onMessage={message => setContent(message.nativeEvent.data)} onLoad={() => {
            webView.current?.injectJavaScript(`window.editor.setData('${props.selectedEditMessage?.content}')`);
        }} injectedJavaScriptBeforeContentLoaded={`
            window.domain = '${props.domain}';
            window.token = '${token}';
            window.school = '${school}';
            true;
        `} /> : null : <Pdf source={{ uri: pdf }} trustAllCerts={false} style={{ flex: 1, marginBottom: 8 }} />}
    </ScrollView>
        </View>
    );
  }