import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import DatePicker from 'react-native-date-picker'
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilePicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util'
import * as FileSystem from 'expo-file-system';
import { Appbar, TextInput, Portal, useTheme, List, Dialog, Paragraph, Button, IconButton } from 'react-native-paper';
import MaxModal from './MaxModal';
import Receivers from './Receivers';
import { IdPlusUrl, File, User, Activity, IdPlusName } from './interfaces';

export default function NewActivity(props: { domain: string | undefined; setSelectedActivity: Dispatch<SetStateAction<Activity | null>>; selectedEditActivity: Activity | null; setSelectedEditActivity: Dispatch<SetStateAction<Activity | null>>; info: User | null; }) {
    const [showReceiversDialog, setShowReceiversDialog] = useState(false);
    const [receiver, setReceiver] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [type, setType] = useState('');
    const [delivery, setDelivery] = useState('');
    const [description, setDescription] = useState('');
    const [showExpirationDate, setShowExpirationDate] = useState(false);
    const [expirationDate, setExpirationDate] = useState<Date | undefined>(undefined);
    const [files, setFiles] = useState<File[]>([]);
    const [oldFiles, setOldFiles] = useState<IdPlusName[]>([]);
    const [pdf, setPdf] = useState<File | null>();
    const [error, setError] = useState('');
    
    const { colors } = useTheme();

    useEffect(() => {
        setReceiver(props.selectedEditActivity?.receiver ?? []);
        setTitle(props.selectedEditActivity?.title ?? '');
        setType(props.selectedEditActivity?.type ?? '');
        setDelivery(props.selectedEditActivity?.delivery ?? '');
        setDescription(props.selectedEditActivity?.description ?? '');
        setExpirationDate(props.selectedEditActivity?.expiration ? new Date(props.selectedEditActivity?.expiration) : undefined);
        setOldFiles(props.selectedEditActivity?.files ?? []);
    }, []);
    
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Portal>
        <MaxModal visible={showReceiversDialog} dismissable={false}>
          <Receivers info={props.info} receiver={receiver} setReceiver={setReceiver} setShowReceiversDialog={setShowReceiversDialog} activity />
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
            <Appbar.BackAction onPress={() => {
                props.setSelectedActivity(props.selectedEditActivity);
                props.setSelectedEditActivity(null);
            }} />
      <Appbar.Content title="Edit activity" />
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
      <Appbar.Action icon="floppy" disabled={(!(title?.length > 0)) || (!(receiver.length > 0))} onPress={async () => { 
                        const thingy: File[] = (pdf ? [pdf] : []).concat(files);
                                if (thingy.length > 0) {
                                    ReactNativeBlobUtil.fetch('POST', props.domain + '/upload', {
                                            'Authorization': await AsyncStorage.getItem('token') ?? "",
                                            'School': await AsyncStorage.getItem('school') ?? "",
                                            'Content-Type' : 'multipart/form-data'
                                        }, thingy).then(res => res.json()).then(async json => {
                                        if (!json?.error) {
                                            const filesIds = (json as IdPlusUrl[]).map(x => x.id);
                                            fetch(props.domain + '/activities/' + props.selectedEditActivity?.id, {
                                                method: 'PATCH',
                                                body: JSON.stringify({
                                                    title: title,
                                                    description: description,
                                                    files: oldFiles.concat(filesIds.map((x, i) => { return { id: x, name: thingy[i].filename }; }).filter((x, i) => !(pdf && i === 0))),
                                                    receiver: receiver,
                                                    type: type,
                                                    delivery: delivery,
                                                    expiration: expirationDate ? expirationDate.getTime() : false
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
                                                        setType('');
                                                        setDelivery('');
                                                        setDescription('');
                                                        setPdf(null);
                                                        setReceiver([]);
                                                        setFiles([]);
                                                        props.setSelectedActivity(props.selectedEditActivity);
                                                    } else {
                                                        setError(json.error);
                                                    }
                                                });
                                        } else {
                                            setError(json.error);
                                        }
                                    });
                                } else {
                                    fetch(props.domain + '/activities/' + props.selectedEditActivity?.id, {
                                        method: 'PATCH',
                                        body: JSON.stringify({
                                            title: title,
                                            description: description,
                                            receiver: receiver,
                                            type: type,
                                            delivery: delivery,
                                            expiration: expirationDate ? expirationDate.getTime() : false
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
                                                setType('');
                                                setDelivery('');
                                                setDescription('');
                                                setPdf(null);
                                                setReceiver([]);
                                                setFiles([]);
                                                props.setSelectedEditActivity(null);
                                            }
                                        });
                                }

                            }} />
    </Appbar.Header>
    <DatePicker modal mode="date" open={showExpirationDate} date={expirationDate ?? new Date()} title="Select expiration date" onConfirm={date => {
                setExpirationDate(date);
                setShowExpirationDate(false);
            }} onCancel={() => setShowExpirationDate(false)} />
    <ScrollView contentContainerStyle={{ flex: 1 }}>
        <Pressable onPress={() => setShowReceiversDialog(true)}>
            <TextInput label="Receivers" value={props.info?.available.filter(x => receiver.includes(x.id)).map(x => x.name).join(', ')} mode="outlined" editable={false} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput label="Expiration date" value={expirationDate?.toString() ?? 'None'} mode="outlined" editable={false} style={{ flex: 1 }} />
            <IconButton icon={!expirationDate ? 'calendar' : 'calendar-remove'} onPress={() => {
                    if(!expirationDate) {
                        setShowExpirationDate(true);
                    } else {
                        setExpirationDate(undefined);
                    }
                    }} />
        </View>
        <TextInput label="Title" mode="outlined" value={title} onChangeText={text => setTitle(text)} />
        <TextInput label="Type" mode="outlined" value={type} onChangeText={text => setType(text)} />
        <TextInput label="Delivery" mode="outlined" value={delivery} onChangeText={text => setDelivery(text)} />
        <List.Accordion
        title="Files"
        expanded
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
        </List.Accordion>
        <TextInput label="Description" mode="outlined" value={description} onChangeText={text => setDescription(text)} multiline />
    </ScrollView>
        </View>
    );
  }