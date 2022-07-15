import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilePicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util'
import * as FileSystem from 'expo-file-system';
import { Appbar, TextInput, Portal, useTheme, Button, Dialog, Paragraph, Text } from 'react-native-paper';
import { File, User } from './interfaces';

export default function NewReport(props: { domain: string | undefined; newReport: boolean; setNewReport: (value: React.SetStateAction<boolean>) => void; info: User | null; }) {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>();
    const [error, setError] = useState('');
    
    const { colors } = useTheme();
    
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            <Appbar.Header>
            <Appbar.BackAction onPress={() => props.setNewReport(false)} />
      <Appbar.Content title="New report" />
      <Appbar.Action icon={!file ? 'file-upload' : 'file-remove'} onPress={() => {
      if(!file) {
        FilePicker.pick({
            copyTo: 'cachesDirectory'
        }).then((response) => {
            response.forEach(file => {
                if(file.fileCopyUri) {
                    FileSystem.readAsStringAsync(file.fileCopyUri, {
                        encoding: FileSystem.EncodingType.Base64
                    }).then(data => {
                       setFile({
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
                    setFile(null);
                }
      }} />
      <Appbar.Action icon="send" disabled={!(title?.length > 0 && file !== null)} onPress={async () => { 
                                if (file) {
                                    ReactNativeBlobUtil.fetch('POST', props.domain + '/upload', {
                                            'Authorization': await AsyncStorage.getItem('token') ?? "",
                                            'School': await AsyncStorage.getItem('school') ?? "",
                                            'Content-Type' : 'multipart/form-data',
                                            'simple': 'true'
                                        }, [file]).then(res => res.json()).then(async json => {
                                            if (!json?.error) {
                                                fetch(props.domain + '/reports', {
                                                    method: 'POST',
                                                    body: JSON.stringify({
                                                        title: title,
                                                        file: { id: json.id, name: file.filename },
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
                                                            setFile(null);
                                                            props.setNewReport(false);
                                                        } else {
                                                            setError(json.error);
                                                        }
                                                    });
                                            } else {
                                                setError(json.error);
                                            }
                                    });
                                }
                            }} />
    </Appbar.Header>
    <ScrollView contentContainerStyle={{ flex: 1 }}>
        <TextInput label="Title" mode="outlined" value={title} onChangeText={text => setTitle(text)} />
        <TextInput label="Report file" value={file?.filename} mode="outlined" editable={false} />
    </ScrollView>
        </View>
    );
  }