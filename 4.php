<?php
ob_start();
error_reporting(E_ALL);
define("API_KEY",'7264788809:AAGRUgbCcsQLiFCehnhEbOrzcJlZnGajgec');
$botname = bot('getme',['bot'])->result->username;

function bot($method,$datas=[]){
    $url = "https://api.telegram.org/bot".API_KEY."/$method";
    $ch = curl_init();
    curl_setopt($ch,CURLOPT_URL,$url);
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
    curl_setopt($ch,CURLOPT_POSTFIELDS,$datas); 
    $res = curl_exec($ch);
    if(curl_error($ch)){
        var_dump(curl_error($ch));
    } else {
        return json_decode($res);
    }
}

$update = json_decode(file_get_contents('php://input'));
if(isset($update->message)){
$message = $update->message;
$messageId = $message->message_id;
$text = $message->text;
$chat_id = $message->chat->id;
$chatId = $message->from->id;
$photo = $message->photo;
}

if ($text == "/start") {
bot('Sendmessage', [
'chat_id' => $chat_id,
'text' => '[ᶠʳᵒᵐ ʲᵃˢᵗ ᵗᵒᵐ](tg://user?id=1427981991)
*• مرحبًا بك في بوت رفع جوده الصور 4K . 
• ارسل لي صوره وانتضر النتيجه .*',
'parse_mode' => "Markdown",
'disable_web_page_preview' => true,
'reply_markup' => json_encode([
'inline_keyboard' => [
[['text' => "• مطور البوت •", 'url' => "https://t.me/suppor1t_ttool"], ['text' => "• قناة البوت •", 'url' => "https://t.me/R_I_d_9"]],
]
])
]);
}

if (isset($photo)) {
$id = bot('sendmessage',[
'chat_id' => $chatId,
'text' => "*• انتضر قليلا . . .*",
'parse_mode' => 'Markdown',
'reply_to_message_id' => $messageId
])->result->message_id;
$file_id = $photo[count($photo) - 1]->file_id;
$response = bot('getFile',[
'file_id' => $file_id
])->result->file_path;

$api = json_decode(file_get_contents("http://167.235.240.118/api/4k_resolution/?link=https://api.telegram.org/file/bot" . API_KEY . "/". $response), true);
        
bot('deleteMessage',[
'chat_id' => $chatId,
'message_id' => $id
]);

if ($api['status'] != 200) {
bot('sendmessage',[
'chat_id' => $chatId,
'text' => "[ᶠʳᵒᵐ ʲᵃˢᵗ ᵗᵒᵐ](tg://user?id=6923004515)
*• حصل خطأ أثناء رفع جودة الصورة *",
'parse_mode' => 'Markdown',
'reply_to_message_id' => $messageId
]);
} else {
bot('sendDocument',[
'chat_id' => $chatId,
'document' => $api['result'],
'caption' => "[ᶠʳᵒᵐ ʲᵃˢᵗ ᵗᵒᵐ](tg://user?id=6923004515)
*• الصورة جاهزة ! 😍 شكرًا على انتظارك! 🤍*",
'parse_mode' => 'Markdown',
]);
}
}