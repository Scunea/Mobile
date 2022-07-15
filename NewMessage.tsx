import { createRef, useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { ScrollView, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilePicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util'
import * as FileSystem from 'expo-file-system';
import { Appbar, TextInput, Portal, useTheme, List, Dialog, Paragraph, Button } from 'react-native-paper';
import Pdf from 'react-native-pdf';
import MaxModal from './MaxModal';
import Receivers from './Receivers';
import CKEditor from './CKEditor';
import { IdPlusUrl, File, User } from './interfaces';

export default function NewMessage(props: { domain: string | undefined; newMessage: boolean; setNewMessage: (value: React.SetStateAction<boolean>) => void; info: User | null; }) {
    const webView = createRef<WebView>();
    
    const [token, setToken] = useState('');
    const [school, setSchool] = useState('');
    const [showReceiversDialog, setShowReceiversDialog] = useState(false);
    const [receiver, setReceiver] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [pdf, setPdf] = useState<File | null>();
    const [error, setError] = useState('');

    useEffect(() => {
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
            <Appbar.BackAction onPress={() => props.setNewMessage(false)} />
      <Appbar.Content title="New message" />
      <Appbar.Action icon={!pdf ? 'file-pdf-box' : 'language-html5'} onPress={() => {
        if(!pdf) {
FilePicker.pick({
    type: ['application/pdf', 'public.pdf'],
    copyTo: 'cachesDirectory'
}).then((response) => {
    response.forEach(file => {
        if(file.fileCopyUri) {
            FileSystem.readAsStringAsync(file.fileCopyUri, {
                encoding: FileSystem.EncodingType.Base64
            }).then(data => {
               setPdf({
                    name: 'upload',
                    filename: file.name,
                    type: file.type ?? '',
                    data: data
                });
    });
}
});
});
        } else {
            setPdf(null);
        }
    }} />
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
      <Appbar.Action icon="send" disabled={(!(title?.length > 0)) || ((!(content.length > 0)) && !pdf) || (!(receiver.length > 0))} onPress={async () => { 
                        const thingy: File[] = (pdf ? [pdf] : []).concat(files);
                                if (thingy.length > 0) {
                                    ReactNativeBlobUtil.fetch('POST', props.domain + '/upload', {
                                            'Authorization': await AsyncStorage.getItem('token') ?? "",
                                            'School': await AsyncStorage.getItem('school') ?? "",
                                            'Content-Type' : 'multipart/form-data'
                                        }, thingy).then(res => res.json()).then(async json => {
                                        if (!json?.error) {
                                            const filesIds = (json as IdPlusUrl[]).map(x => x.id);
                                            fetch(props.domain + '/messages', {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                    title: title,
                                                    content: !pdf ? content: {
                                                        pdf: filesIds[0]
                                                    },
                                                    files: filesIds.map((x, i) => { return { id: x, name: thingy[i].filename }; }).filter((x, i) => !(pdf && i === 0)),
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
                                                        props.setNewMessage(false);
                                                    } else {
                                                        setError(json.error);
                                                    }
                                                });
                                        } else {
                                            setError(json.error);
                                        }
                                    });
                                } else {
                                    fetch(props.domain + '/messages', {
                                        method: 'POST',
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
                                                props.setNewMessage(false);
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
        <List.Accordion
        title="Files"
        expanded
        left={props => <List.Icon {...props} icon="file" />}>
        {files.map((file, i) => <List.Item key={i} title={file.filename} onPress={() => {
          setFiles(files => {
            let newFiles = [...files];
            newFiles.splice(i, 1);
            return newFiles;
          });
        }} />)}
        </List.Accordion>
        {!pdf ? token && school ? <WebView ref={webView} source={{ html: CKEditor }} onMessage={message => setContent(message.nativeEvent.data)} injectedJavaScriptBeforeContentLoaded={`
            window.domain = '${props.domain}';
            window.token = '${token}';
            window.school = '${school}';
            true;
        `} /> : null : <Pdf source={{ uri: 'data:application/pdf;base64,' + pdf.data }} trustAllCerts={false} style={{ flex: 1, marginBottom: 8 }} />}
    </ScrollView>
        </View>
    );
  }