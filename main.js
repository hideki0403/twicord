// Twitter x Discord   TwicordProject
// Created by @hideki_0403
//
// このソースコードの二次配布・改変配布・無断利用を固く禁じます。
// お問い合わせは https://twitter.com/hideki_0403 まで。
//
// Website http://hideki0403.ml
//
// 使用モジュール: eris, twitter, oauth, twitter-pin-oauth, axios
//
// 以下のようにディレクトリ構成をしないと動きません。
// ./lib --> メインライブラリ
// ./lib/cache --> キャッシュ保存用フォルダ
// ./lib/key --> TwitterAccessTokenKey,secret保存用フォルダ
// ./lib/settings --> ユーザー設定ファイル保存用フォルダ

const eris = require('eris')
const token = require('./config.conf')['token']
const bot = new eris(token)
const fs = require('fs')
const twitter = require('twitter')
const oauth = require('oauth')
const consumerKey = require('./config.conf')['consumerKey']
const consumerSecret = require('./config.conf')['consumerSecret']
const bearerToken = require('./config.conf')['bearerToken']
const TwitterPinAuth = require('twitter-pin-auth')
const twitterPinAuth = new TwitterPinAuth(consumerKey, consumerSecret, false)
const axios = require('axios')
const dir = '/home/pi/デスクトップ/DiscordBots/twicord/'
//const dir = './'
var verify = false
addPicture = false
var mediaIDs = []
editSettings = false
tweetIDcache = ''

bot.on('ready', (msg) => {
    console.log('Ready...')
    bot.editStatus('online', {name: '.tc help | ' + Object.keys(bot.guildShardMap).length + ' servers & ' + bot.users.size + ' users'})
})

// 3分おきにステータス更新
setInterval (function () {
    bot.editStatus('online', {name: '.tc help | ' + Object.keys(bot.guildShardMap).length + ' servers & ' + bot.users.size + ' users'})
//    fs.writeFileSync(dir + 'cnf.dat', hatsugen)
}, 180000)

// ファイル存在確認
function isExistFile(name) {
    try {
        fs.statSync(dir + 'lib/key/' + name + '.key')
        return true
    } catch(err) {
        if(err.conde === 'ENOENT') return false
    }
}

function isExistCacheFile(name) {
    try {
        fs.statSync(dir + 'lib/cache/cache-' + name + '.tmp')
        return true
    } catch(err) {
        if(err.conde === 'ENOENT') return false
    }
}

function isExistSettingsFile(name) {
    try {
        fs.statSync(dir + 'lib/settings/' + name + '.conf')
        return true
    } catch(err) {
        if(err.conde === 'ENOENT') return false
    }
}

bot.on('messageCreate', (msg) => {
    if(msg.content === '.login') {
        if(true === isExistFile(msg.author.id)) {
            bot.createMessage(msg.channel.id, {
                embed: {
                    color: 0xff1919,
                    author: {
                        name: 'Error',
                        icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                    },
                    description: 'あなたは既に連携しています。'
                }
            })
        } else {
            bot.createMessage(msg.channel.id, 'DMにて認証リンクを送信しました。\nご確認ください。')
            var verify = true
            twitterPinAuth.requestAuthUrl()
                .then(function(url) {
                    bot.getDMChannel(msg.author.id)
                        .then (ch => {
                            bot.createMessage(ch.id, {
                                embed: {
                                    author: {
                                        name: 'Twicord Oauth',
                                        icon_url: msg.author.avatarURL
                                    },
                                    description: 'Twicordの連携は[こちら](' + url + ')から行ってください。\n認証後、7桁の数字が表示されますので、先ほどのチャンネルに張り付けてください。\n自動的に認証が行われます。',
                                    color: 0x429bf4
                                }
                            })
                        })
                        
                }).catch(function(err) {
                    bot.createMessage(msg.channel.id, {
                        embed: {
                            color: 0xff1919,
                            author: {
                                name: 'Error',
                                icon_url: msg.author.avatarURL
                            },
                            description: err
                        }
                    })
                    console.log('err')
                })
        }
    }
})

bot.on('messageCreate', (msg) => {
    if(verify = true) {
    if(msg.content.match(/^([1-9]\d*|0)$/)) {
        if(msg.content.length === 7) {
            bot.deleteMessage(msg.channel.id, msg.id, '')
            twitterPinAuth.authorize(msg.content)
                .then(function(data) {
                    bot.createMessage(msg.channel.id, {
                        embed: {
                            color: 0x44fc53,
                            author: {
                                name: 'Success!',
                                icon_url: 'https://png.icons8.com/color/50/000000/ok.png'
                            },
                            description: '認証が完了しました。',
                            footer: {
                                text: msg.author.username,
                                icon_url: msg.author.avatarURL
                            }
                        }
                    })
                    var accountData = {
                        key: data.accessTokenKey,
                        secret: data.accessTokenSecret
                    }
                    fs.writeFileSync(dir + 'lib/key/' + msg.author.id + '.key', JSON.stringify(accountData, null))
                }).catch(function(err) {
                    console.error(err)
                    bot.createMessage(msg.channel.id, {
                        embed: {
                            color: 0xff1919,
                            author: {
                                name: 'Error',
                                icon_url: msg.author.avatarURL
                            },
                            description: err
                        }
                    })
                })
                var verify = false
        }
    }
}
})

bot.on('messageCreate', (msg) => {
    if(msg.content.match(/.tweet .*?/)) {
        if(true === isExistFile(msg.author.id)) {
            var cache = fs.readFileSync(dir + 'lib/key/' + msg.author.id + '.key', 'utf-8')
            var accountData = JSON.parse(cache)
            var client = new twitter({
                consumer_key: consumerKey,
                consumer_secret: consumerSecret,
                access_token_key: accountData.key,
                access_token_secret: accountData.secret,
            })
            var tweetContent = msg.content.replace('.tweet ', '')
            if(addPicture === false) {
                client.post('statuses/update',
                    {status: tweetContent},
                        function(error, tweet, response) {
                            if (!error) {
                                bot.createMessage(msg.channel.id, {
                                    embed: {
                                        color: 0x1ebfff,
                                        author: {
                                            name: '[' + tweet.user.name + '] ツイートをしました!',
                                            icon_url: 'https://g.twimg.com/ios_homescreen_icon.png'
                                        },
                                        description: tweetContent,
                                        footer: {
                                            text: '@' + tweet.user.screen_name + ' (' + tweet.id_str + ')',
                                            icon_url: tweet.user.profile_image_url
                                        }
                                    }
                                })
                                tweetIDcache = tweet.id_str
                                tweetUserCache = tweet.user.name
                            } else {
                                bot.createMessage(msg.channel.id, {
                                    embed: {
                                        color: 0xff1919,
                                        author: {
                                            name: 'ErrorCode:' + error[0].code,
                                            icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                                        },
                                        description: error[0].message
                                    }
                                })
                            }
                })
                
            } else {
                addPicture = false
                client.post('statuses/update',{
                    status: tweetContent,
                    media_ids: mediaID
                },
                    function(error, tweet, response) {
                        if (!error) {
                            bot.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0x1ebfff,
                                    author: {
                                        name: '[' + tweet.user.name + '] 画像付きツイートをしました!',
                                        icon_url: 'https://g.twimg.com/ios_homescreen_icon.png'
                                    },
                                    description: tweetContent,
                                    footer: {
                                        text: '@' + tweet.user.screen_name,
                                        icon_url: tweet.user.profile_image_url
                                    }
                                }
                            })
                        } else {
                            bot.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0xff1919,
                                    author: {
                                        name: 'ErrorCode:' + error[0].code,
                                        icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                                    },
                                    description: error[0].message
                                }
                            })
                        }
            })
            }
            
        } else {
            bot.createMessage(msg.channel.id, {
                embed: {
                    color: 0xff1919,
                    author: {
                        name: 'Error',
                        icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                    },
                    description: 'あなたはまだTwicordとは連携していません。\n.login を実行して、Twitterと連携をしてください。'
                }
            })
        }
    }
})

bot.on('messageCreate', (msg) => {
        if(msg.author.bot === false) {
            if(msg.content === '.tc invite') {
                bot.createMessage(msg.channel.id, {
                    embed: {
                        author: {
                            name: 'Twicord invite',
                            icon_url: msg.author.avatarURL
                        },
                        description: '[こちらのリンク](https://discordapp.com/api/oauth2/authorize?client_id=448454207427706880&permissions=24576&scope=bot)から招待できます',
                        color: 0x429bf4
                    }
                })
            }
        }
    
})

bot.on('messageCreate', (msg) => {
    if(msg.author.bot === false) {
        if(msg.content === '.tc logout') {
            function deleteFile(name) {
                try {
                    fs.statSync(dir + 'lib/key/' + name + '.key')
                    return true
                } catch(err) {
                    if(err.conde === 'ENOENT') return false
                }
            }
            if(true === deleteFile(msg.author.id)) {
                fs.unlinkSync(dir + 'lib/key/' + msg.author.id + '.key')
                bot.createMessage(msg.channel.id, {
                    embed: {
                        color: 0xff1919,
                        author: {
                            name: 'Twicord ログアウト完了',
                            icon_url: msg.author.avatarURL
                        },
                        description: 'Twicodeの認証データの削除が完了しました。また利用するには再度連携が必要です。'
                    }
                })
            } else {
            bot.createMessage(msg.channel.id, {
                embed: {
                    color: 0xff1919,
                    author: {
                        name: 'Error',
                        icon_url: msg.author.avatarURL
                    },
                    description: '認証データファイルが存在していませんでした。'
                }
            })
        }
    }
}
})

bot.on('messageCreate', (msg) => {
    if(msg.author.bot === false) {
    if(msg.content === '.tc help') {
        bot.createMessage(msg.channel.id, {
            embed: {
                author: {
                    name: 'Twicord HelpMenu',
                    icon_url: msg.author.avatarURL
                },
                description: 'Twicordのヘルプです。',
                color: 0x429bf4,
                footer: {
                    text: 'Created by hideki0403#7963'
                },
                fields: [
                    {
                        name: '.login',
                        value: 'TwicordとTwitterを連携するためのURLをDMにて発行します。'
                    } , {
                        name: '.tweet <ツイート本文>',
                        value: 'Discord内からツイートをします。何かしらエラーが発生した場合はエラーコードが出力されます。\n**※要連携**'
                    } , {
                        name: '.add',
                        value: 'ツイートしたい画像を追加することができます。'
                    } , {
                        name: '.setting',
                        value: 'ステータス変化やプレイ中のゲーム変化時に自動ツイートするか否かを設定できます。'
                    } , {
                        name: '.profile <TwitterID>',
                        value: '指定したユーザーのプロフィールを表示します。'
                    } , {
                        name: '.tc invite',
                        value: 'Twicordをあなたのサーバーにも招待できるURLを発行します。'
                    } , {
                        name: '.tc logout',
                        value: 'Twicordからログアウトします。'
                    } ,  {                       
                        name: '.tc help',
                        value: 'このヘルプメニューです。'
                    }
                ]
            }
        })
    } else {
        if(msg.content === '.setting') {
            if(isExistSettingsFile(msg.author.id) === true) {
                var settings = JSON.parse(fs.readFileSync(dir + 'lib/settings/' + msg.author.id + '.conf'))
                editSettings = true
                bot.createMessage(msg.channel.id, {
                    embed: {
                        color: 0x44fc53,
                        author: {
                            name: 'SettingsMenu',
                        },
                        description: '変更する内容を数字で指定してください。\nトグル式になっているのでfalseだった場合はtrue、trueだった場合はfalseに変更されます。\n**※false=無効/true=有効**\n\ncancelと入力することで中断できます。',
                        fields: [
                            {
                                name: '1',
                                value: 'ステータス変更時に自動ツイート（現在: ' + settings.status + ' ）'
                            } , {
                                name: '2',
                                value: 'プレイ中のゲーム変更時に自動ツイート（現在: ' + settings.game + ' ）'
                            }
                        ],
                        footer: {
                            text: msg.author.username,
                            icon_url: msg.author.avatarURL
                        }
                    }
                })
            } else {
                var data = {
                    status: false,
                    game: false
                }
                fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                bot.createMessage(msg.channel.id, {
                    embed: {
                        color: 0x44fc53,
                        author: {
                            name: 'Settingsファイルを生成しました。',
                            icon_url: 'https://png.icons8.com/color/50/000000/ok.png'
                        },
                        description: 'あなたのSettingsファイルが存在しなかったため、自動生成されました。\nもう一度 .setting と入力することで設定を変更することができます。',
    
                        footer: {
                            text: msg.author.username,
                            icon_url: msg.author.avatarURL
                        }
                    }
                })
            }
        } else {
            if(editSettings === true) {
                var settings = JSON.parse(fs.readFileSync(dir + 'lib/settings/' + msg.author.id + '.conf'))
                if(msg.content === '1') {
                    editSettings = false
                    if(settings.status === false) {
                        var data = {
                            status: true,
                            game: settings.game
                        }
                        fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                        bot.createMessage(msg.channel.id, {
                            embed: {
                                color: 0x44fc53,
                                author: {
                                    name: 'SettingsMenu',
                                },
                                description: 'ステータス変更時に自動ツイートする設定を**有効化**しました。',
                                footer: {
                                    text: msg.author.username,
                                    icon_url: msg.author.avatarURL
                                }
                            }
                        })
                    } else {
                        var data = {
                            status: false,
                            game: settings.game
                        }
                        fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                        bot.createMessage(msg.channel.id, {
                            embed: {
                                color: 0x44fc53,
                                author: {
                                    name: 'SettingsMenu',
                                },
                                description: 'ステータス変更時に自動ツイートする設定を**無効化**しました。',
                                footer: {
                                    text: msg.author.username,
                                    icon_url: msg.author.avatarURL
                                }
                            }
                        })
                    }
                } else {
                    if(msg.content === '2') {
                        editSettings = false
                        if(settings.game === false) {
                            var data = {
                                status: settings.status,
                                game: true
                            }
                            fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                            bot.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0x44fc53,
                                    author: {
                                        name: 'SettingsMenu',
                                    },
                                    description: 'プレイ中のゲーム変更時に自動ツイートする設定を**有効化**しました。',
                                    footer: {
                                        text: msg.author.username,
                                        icon_url: msg.author.avatarURL
                                    }
                                }
                            })
                        } else {
                            var data = {
                                status: settings.status,
                                game: false
                            }
                            fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                            bot.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0x44fc53,
                                    author: {
                                        name: 'SettingsMenu',
                                    },
                                    description: 'プレイ中のゲーム変更時に自動ツイートする設定を**無効化**しました。',
                                    footer: {
                                        text: msg.author.username,
                                        icon_url: msg.author.avatarURL
                                    }
                                }
                            })
                        }
                    } else {
                        if(msg.content === 'cancel') {
                            editSettings = false
                            bot.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0x44fc53,
                                    author: {
                                        name: '設定の変更をキャンセルしました。',
                                        icon_url: 'https://png.icons8.com/color/50/000000/ok.png'
                                    },
                                    description: '設定の変更をキャンセルしました。',
                
                                    footer: {
                                        text: msg.author.username,
                                        icon_url: msg.author.avatarURL
                                    }
                                }
                            })
                        }
                    }
                }
            }
        }
    }
}
})

bot.on('messageCreate', (msg) => {
    if(msg.content.match(/.profile .*?/)) {
            var client = new twitter({
                consumer_key: consumerKey,
                consumer_secret: consumerSecret,
                bearer_token: bearerToken
            })
            var msgContent = msg.content.replace('.profile ', '')
            client.get('users/show',
                {screen_name: msgContent},
                function(error, tweets, response) {
                    // 公式垢か判別
                    if(tweets.verified === true) {
                        var accountVerifiedStatus = 'https://g.twimg.com/blog/blog/image/verified.png'
                    } else {
                        // 非公式垢でかつ鍵垢であるか判別
                        if(tweets.protected === true) {
                            var accountVerifiedStatus = 'https://i.gyazo.com/63f835f80af9738010aed7da05a646d0.png'
                        } else {
                            var accountVerifiedStatus = ''
                        }
                    }

                    // location未設定落ち回避
                    if(tweets.location === '') {
                        var setlocation = '📍[未設定]'
                    } else {
                        var setlocation = '📍' + tweets.location
                    }

                    // URL未設定落ち回避
                    if(tweets.url === null) {
                        var setStatus = setlocation + '  🔗[未設定]'
                    } else {
                        var setStatus = setlocation + '  🔗' + tweets.entities.url.urls[0].expanded_url
                    }

                    // アカウントが存在するかチェック
                    var embedColor = parseInt('0x' + tweets.profile_link_color, 16)
                    if(error) {
                        bot.createMessage(msg.channel.id, {
                            embed: {
                                color: 0xff1919,
                                author: {
                                    name: 'ErrorCode:' + errors[0].code,
                                    icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                                },
                                description: errors[0].message
                            }
                        })
                    } else {
                        console.log(embedColor)
                        bot.createMessage(msg.channel.id, {
                            embed: {
                                author: {
                                    name: tweets.name,
                                    icon_url: accountVerifiedStatus
                                },
                                title:  setStatus,
                                color: embedColor,
                                description: tweets.description,
                                thumbnail: {
                                    url: tweets.profile_image_url
                                },
                                image: {
                                    url: tweets.profile_banner_url
                                },
                                fields: [
                                    {
                                        name: 'ツイート数',
                                        value: tweets.statuses_count
                                    } , {
                                        name: 'フォロー',
                                        value: tweets.friends_count + '人'
                                    } , {
                                        name: 'フォロワー',
                                        value: tweets.followers_count + '人'
                                    } , {
                                        name: 'いいね数',
                                        value: tweets.favourites_count
                                    }
                                ],
                                footer: {
                                    text: 'Twicord'
                                }
                            }
                        })
                    }
                })
            }
})



bot.on('messageCreate', (msg) => {
    if(msg.content === '.add') {
        if(isExistFile(msg.author.id) === true) {
            addPicture = true
            bot.createMessage(msg.channel.id, {
                embed: {
                    color: 0x44fc53,
                    author: {
                        name: '画像追加モード:ON',
                        icon_url: 'https://png.icons8.com/color/50/000000/ok.png'
                    },
                    description: 'ツイートしたい画像を送信してください。（一枚のみ）\ncancelと入力することで中断できます。',
                    footer: {
                        text: msg.author.username,
                        icon_url: msg.author.avatarURL
                    }
                }
            })
        } else {
            bot.createMessage(msg.channel.id, {
                embed: {
                    color: 0xff1919,
                    author: {
                        name: 'Error',
                        icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                    },
                    description: 'あなたはまだTwicordとは連携していません。\n.login を実行して、Twitterと連携をしてください。'
                }
            })
        }
    }
})

bot.on('messageCreate', (msg) => {
    if(addPicture === true) {
        if(msg.content === 'cancel') {
            addPicture = false
            bot.createMessage(msg.channel.id, {
                embed: {
                    color: 0xff1919,
                    author: {
                        name: 'Error',
                        icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                    },
                    description: '画像の追加がキャンセルされました。'
                }
            })
        }
        var picture = msg.attachments
        if(picture[0] === undefined) {
        } else {
                var cache = fs.readFileSync(dir + 'lib/key/' + msg.author.id + '.key', 'utf-8')
                var accountData = JSON.parse(cache)
                var client = new twitter({
                    consumer_key: consumerKey,
                    consumer_secret: consumerSecret,
                    access_token_key: accountData.key,
                    access_token_secret: accountData.secret,
                })
                console.log('取得します')
                console.log(picture[0].url)
                var picture = msg.attachments
                var runPick = async () => {
                    const res = await axios.get(picture[0].url, {responseType: 'arraybuffer'})
                    fs.writeFileSync(dir + 'lib/cache/cache-' + msg.author.id + '.png', new Buffer(res.data), 'binary')
                    var data = fs.readFileSync(dir + 'lib/cache/cache-' + msg.author.id + '.png')
                    await client.post('media/upload', {media: data}, function(error, media, response) {
                        if (!error) {
                            mediaID = media.media_id_string
                            console.log(media.media_id_string)
                            bot.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0x44fc53,
                                    author: {
                                        name: '画像を追加しました',
                                        icon_url: 'https://png.icons8.com/color/50/000000/ok.png'
                                    },
                                    description: '画像を追加しました。',
        
                                    footer: {
                                        text: msg.author.username,
                                        icon_url: msg.author.avatarURL
                                    }
                                }
                            })
                        } else {
                            bot.createMessage(msg.channel.id, {
                                embed: {
                                    color: 0xff1919,
                                    author: {
                                        name: 'ErrorCode:' + error[0].code,
                                        icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                                    },
                                    description: error[0].message
                                }
                            })
                        }
                    }) 
                }
                runPick()

        }
    }
})

// Settings生成
/*
bot.on('messageCreate', (msg) => {
    if(msg.content === '.setting') {
        if(isExistSettingsFile(msg.author.id) === false) {
            var data = {
                status: false,
                game: false
            }
            fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
            bot.createMessage(msg.channel.id, {
                embed: {
                    color: 0x44fc53,
                    author: {
                        name: 'Settingsファイルを生成しました。',
                        icon_url: 'https://png.icons8.com/color/50/000000/ok.png'
                    },
                    description: 'あなたのSettingsファイルが存在しなかったため、自動生成されました。\nもう一度 .setting と入力することで設定を変更することができます。',

                    footer: {
                        text: msg.author.username,
                        icon_url: msg.author.avatarURL
                    }
                }
            })
        } else {
            var setting = JSON.parse(fs.readFileSync(dir + 'lib/settings/' + msg.author.id + '.conf'))
            editSettings = true
            bot.createMessage(msg.channel.id, {
                embed: {
                    color: 0x44fc53,
                    author: {
                        name: 'SettingsMenu',
                    },
                    description: '変更する内容を数字で指定してください。\nトグル式になっているのでfalseだった場合はtrue、trueだった場合はfalseに変更されます。\n**※false=無効/true=有効**\n\ncancelと入力することで中断できます。',
                    fields: [
                        {
                            name: '1',
                            value: 'ステータス変更時に自動ツイート（現在: ' + settings.status + ' ）'
                        } , {
                            name: '2',
                            value: 'プレイ中のゲーム変更時に自動ツイート（現在: ' + settings.game + ' ）'
                        }
                    ],
                    footer: {
                        text: msg.author.username,
                        icon_url: msg.author.avatarURL
                    }
                }
            })
        }
    } else {
        if(editSettings === true) {
            var setting = JSON.parse(fs.readFileSync(dir + 'lib/settings/' + msg.author.id + '.conf'))
            if(msg.content === '1') {
                editSettings = false
                if(settings.status === false) {
                    var data = {
                        status: true,
                        game: settings.game
                    }
                    fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                    bot.createMessage(msg.channel.id, {
                        embed: {
                            color: 0x44fc53,
                            author: {
                                name: 'SettingsMenu',
                            },
                            description: 'ステータス変更時に自動ツイートする設定を**有効化**しました。',
                            footer: {
                                text: msg.author.username,
                                icon_url: msg.author.avatarURL
                            }
                        }
                    })
                } else {
                    var data = {
                        status: false,
                        game: settings.game
                    }
                    fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                    bot.createMessage(msg.channel.id, {
                        embed: {
                            color: 0x44fc53,
                            author: {
                                name: 'SettingsMenu',
                            },
                            description: 'ステータス変更時に自動ツイートする設定を**無効化**しました。',
                            footer: {
                                text: msg.author.username,
                                icon_url: msg.author.avatarURL
                            }
                        }
                    })
                }
            } else {
                if(msg.content === '2') {
                    editSettings = false
                    if(settings.game === false) {
                        var data = {
                            status: settings.status,
                            game: true
                        }
                        fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                        bot.createMessage(msg.channel.id, {
                            embed: {
                                color: 0x44fc53,
                                author: {
                                    name: 'SettingsMenu',
                                },
                                description: 'プレイ中のゲーム変更時に自動ツイートする設定を**有効化**しました。',
                                footer: {
                                    text: msg.author.username,
                                    icon_url: msg.author.avatarURL
                                }
                            }
                        })
                    } else {
                        var data = {
                            status: settings.status,
                            game: false
                        }
                        fs.writeFileSync(dir + 'lib/settings/' + msg.author.id + '.conf', JSON.stringify(data, null))
                        bot.createMessage(msg.channel.id, {
                            embed: {
                                color: 0x44fc53,
                                author: {
                                    name: 'SettingsMenu',
                                },
                                description: 'プレイ中のゲーム変更時に自動ツイートする設定を**無効化**しました。',
                                footer: {
                                    text: msg.author.username,
                                    icon_url: msg.author.avatarURL
                                }
                            }
                        })
                    }
                }
            }
        }
    }
})
*/


bot.on('messageCreate', (msg) => {
    console.log(msg.embeds.length)
    if(msg.author.id === bot.user.id) {
        if(msg.embeds.length === 1) {
            console.log('ok')
            if(msg.embeds[0].footer.text.indexOf(tweetIDcache) > -1) {
                var count = msg.embeds[0].footer.text
                var countreplace = count.replace(/.*? \(/, '')
                var replace2 = countreplace.replace(')', '')
    
                if(replace2.length === 19) {
                    // 保存
                    var data = {
                        content: msg.embeds[0].description,
                        user: tweetUserCache,
                        id: tweetIDcache
                    }
                    fs.writeFileSync(dir + 'lib/cache/cache-' + msg.id + '.tmp', JSON.stringify(data, null))
                    bot.addMessageReaction(msg.channel.id, msg.id, '❤')
                    bot.addMessageReaction(msg.channel.id, msg.id, '🔁')
                }
            }
        }  
    }
})

bot.on('messageReactionAdd', (msg, emoji, userid) => {
    if(emoji.name.match(/❤|🔁/)) {
        if(isExistCacheFile(msg.id) === true) {
            var tweetData = JSON.parse(fs.readFileSync(dir + 'lib/cache/cache-' + msg.id + '.tmp'))
                if(isExistFile(userid) === true) {
                    if(emoji.name === '❤') {
                        console.log('ふぁぼ')
                        var cache = fs.readFileSync(dir + 'lib/key/' + userid + '.key', 'utf-8')
                        var accountData = JSON.parse(cache)
                        var client = new twitter({
                            consumer_key: consumerKey,
                            consumer_secret: consumerSecret,
                            access_token_key: accountData.key,
                            access_token_secret: accountData.secret,
                        })
                        client.post('favorites/create', {id: tweetData.id}, function(error, tweet, response) {
                            if (!error) {
                                console.log('ok')
                                bot.createMessage(msg.channel.id, {
                                        embed: {
                                            color: 0xfc1955,
                                            author: {
                                                name: '[' + tweet.user.name + '] いいね！をしました!',
                                                icon_url: 'https://pbs.twimg.com/media/De_yKcaV4AAevK1.jpg'
                                            },
                                            description: tweetData.user + 'さんのツイート: ' + tweetData.content,
                                            footer: {
                                                text: '@' + tweet.user.screen_name,
                                                icon_url: tweet.user.profile_image_url
                                            }
                                        }
                                    })
                            } else {
                                bot.createMessage(msg.channel.id, {
                                    embed: {
                                        color: 0xff1919,
                                        author: {
                                            name: 'ErrorCode:' + error[0].code,
                                            icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                                        },
                                        description: error[0].message
                                    }
                                })
                            }
                        })

                    } else {
                        if(emoji.name === '🔁') {
                            console.log('RT')
                            var cache = fs.readFileSync(dir + 'lib/key/' + userid + '.key', 'utf-8')
                            var accountData = JSON.parse(cache)
                            var client = new twitter({
                                consumer_key: consumerKey,
                                consumer_secret: consumerSecret,
                                access_token_key: accountData.key,
                                access_token_secret: accountData.secret,
                            })
                            client.post('statuses/retweet', {id: tweetData.id}, function(error, tweet, response) {
                                if (!error) {
                                    console.log('ok')
                                    bot.createMessage(msg.channel.id, {
                                        embed: {
                                            color: 0x10e81b,
                                            author: {
                                                name: '[' + tweet.user.name + '] リツイートをしました!',
                                                icon_url: 'https://pbs.twimg.com/media/DfAbceFUcAA_g8x.jpg'
                                            },
                                            description: tweetData.user + 'さんのツイート: ' + tweetData.content,
                                            footer: {
                                                text: '@' + tweet.user.screen_name,
                                                icon_url: tweet.user.profile_image_url
                                            }
                                        }
                                    })
                                } else {
                                    bot.createMessage(msg.channel.id, {
                                        embed: {
                                            color: 0xff1919,
                                            author: {
                                                name: 'ErrorCode:' + error[0].code,
                                                icon_url: 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/72/sign-error-icon.png'
                                            },
                                            description: error[0].message
                                        }
                                    })
                                }
                            })
                        }
                    }     

            }
        }   
    } 
})


i = 0

bot.on('presenceUpdate', (member, oldPresence) => {
        i++
        if(i === 1) {
            if(isExistSettingsFile(member.id) === true) {
                var settings = JSON.parse(fs.readFileSync(dir + 'lib/settings/' + member.id + '.conf'))
                if(settings.status === true) {
                    if(member.status ===! oldPresence.status) {
                        if(member.status === 'online') {memStatus = 'オンライン'}
                        if(member.status === 'idle') {memStatus = '退席中'}
                        if(member.status === 'dnd') {memStatus = '起こさないで'}
                        if(member.status === 'offline') {memStatus = 'オフライン'}
                        var cache = fs.readFileSync(dir + 'lib/key/' + member.id + '.key', 'utf-8')
                        var accountData = JSON.parse(cache)
                        var client = new twitter({
                            consumer_key: consumerKey,
                            consumer_secret: consumerSecret,
                            access_token_key: accountData.key,
                            access_token_secret: accountData.secret,
                        })
                        var eqtimevars = new Date()
                        var fullyear = eqtimevars.getFullYear()
                        var month = ('0' + (eqtimevars.getMonth() + 1)).slice(-2)
                        var date = ('0' + eqtimevars.getDate()).slice(-2)
                        var hours = ('0' + eqtimevars.getHours()).slice(-2)
                        var minutes = ('0' + eqtimevars.getMinutes()).slice(-2)
                        var seconds = ('0' + eqtimevars.getSeconds()).slice(-2)
                        var timedata = hours + '時' + minutes + '分' + seconds + '秒現在' // ex.)20180117174403
                        var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんのステータスが' + memStatus + 'になりました。（' + timedata + ')'
                            client.post('statuses/update',
                                {status: tweetContent},
                                    function(error, tweet, response) {
                                        if(!error) {
                                            console.log('Success')
                                        }
                                    }
                                )
                    } else {
                        if(settings.game === true) {
                            console.log(oldPresence.game)
                            if(oldPresence.game === null) {
                                if(member.game.type === 0) {
                                    var eqtimevars = new Date()
                                    var fullyear = eqtimevars.getFullYear()
                                    var month = ('0' + (eqtimevars.getMonth() + 1)).slice(-2)
                                    var date = ('0' + eqtimevars.getDate()).slice(-2)
                                    var hours = ('0' + eqtimevars.getHours()).slice(-2)
                                    var minutes = ('0' + eqtimevars.getMinutes()).slice(-2)
                                    var seconds = ('0' + eqtimevars.getSeconds()).slice(-2)
                                    var timedata = hours + '時' + minutes + '分' + seconds + '秒現在' // ex.)20180117174403
                                    var cache = fs.readFileSync(dir + 'lib/key/' + member.id + '.key', 'utf-8')
                                    var accountData = JSON.parse(cache)
                                    var client = new twitter({
                                        consumer_key: consumerKey,
                                        consumer_secret: consumerSecret,
                                        access_token_key: accountData.key,
                                        access_token_secret: accountData.secret,
                                    })
                                    var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんが「' + member.game.name + '」をプレイし始めました。（' + timedata + ')'
                                        client.post('statuses/update',
                                            {status: tweetContent},
                                                function(error, tweet, response) {
                                                    if(!error) {
                                                        console.log('Success')
                                                    }
                                                }
                                            )
                                            
                                }
                            } else {
                                if(member.game === null) {
                                    var eqtimevars = new Date()
                                    var fullyear = eqtimevars.getFullYear()
                                    var month = ('0' + (eqtimevars.getMonth() + 1)).slice(-2)
                                    var date = ('0' + eqtimevars.getDate()).slice(-2)
                                    var hours = ('0' + eqtimevars.getHours()).slice(-2)
                                    var minutes = ('0' + eqtimevars.getMinutes()).slice(-2)
                                    var seconds = ('0' + eqtimevars.getSeconds()).slice(-2)
                                    var timedata = hours + '時' + minutes + '分' + seconds + '秒現在' // ex.)20180117174403
                                    var cache = fs.readFileSync(dir + 'lib/key/' + member.id + '.key', 'utf-8')
                                    var accountData = JSON.parse(cache)
                                    var client = new twitter({
                                        consumer_key: consumerKey,
                                        consumer_secret: consumerSecret,
                                        access_token_key: accountData.key,
                                        access_token_secret: accountData.secret,
                                    })
                                    var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんが遊んでいるゲームはありません。（' + timedata + ')'
                                        client.post('statuses/update',
                                            {status: tweetContent},
                                                function(error, tweet, response) {
                                                    if(!error) {
                                                        console.log('Success')
                                                    }
                                                }
                                            )
                                } else {
                                    var eqtimevars = new Date()
                                    var fullyear = eqtimevars.getFullYear()
                                    var month = ('0' + (eqtimevars.getMonth() + 1)).slice(-2)
                                    var date = ('0' + eqtimevars.getDate()).slice(-2)
                                    var hours = ('0' + eqtimevars.getHours()).slice(-2)
                                    var minutes = ('0' + eqtimevars.getMinutes()).slice(-2)
                                    var seconds = ('0' + eqtimevars.getSeconds()).slice(-2)
                                    var timedata = hours + '時' + minutes + '分' + seconds + '秒現在' // ex.)20180117174403
                                    var cache = fs.readFileSync(dir + 'lib/key/' + member.id + '.key', 'utf-8')
                                    var accountData = JSON.parse(cache)
                                    var client = new twitter({
                                        consumer_key: consumerKey,
                                        consumer_secret: consumerSecret,
                                        access_token_key: accountData.key,
                                        access_token_secret: accountData.secret,
                                    })
                                    var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんが遊んでいるゲームが「' + oldPresence.game.name + '」から「' + member.game.name + '」に変わりました。（' + timedata + ')'
                                        client.post('statuses/update',
                                            {status: tweetContent},
                                                function(error, tweet, response) {
                                                    if(!error) {
                                                        console.log('Success')
                                                    }
                                                }
                                            ) 
                                }
                            }
                        }
                    }
                } else {
                    if(settings.game === true) {
                        console.log(oldPresence.game)
                        if(oldPresence.game === null) {
                            if(member.game.type === 0) {
                                var eqtimevars = new Date()
                                var fullyear = eqtimevars.getFullYear()
                                var month = ('0' + (eqtimevars.getMonth() + 1)).slice(-2)
                                var date = ('0' + eqtimevars.getDate()).slice(-2)
                                var hours = ('0' + eqtimevars.getHours()).slice(-2)
                                var minutes = ('0' + eqtimevars.getMinutes()).slice(-2)
                                var seconds = ('0' + eqtimevars.getSeconds()).slice(-2)
                                var timedata = hours + '時' + minutes + '分' + seconds + '秒現在' // ex.)20180117174403
                                var cache = fs.readFileSync(dir + 'lib/key/' + member.id + '.key', 'utf-8')
                                var accountData = JSON.parse(cache)
                                var client = new twitter({
                                    consumer_key: consumerKey,
                                    consumer_secret: consumerSecret,
                                    access_token_key: accountData.key,
                                    access_token_secret: accountData.secret,
                                })
                                var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんが「' + member.game.name + '」をプレイし始めました。（' + timedata + ')'
                                    client.post('statuses/update',
                                        {status: tweetContent},
                                            function(error, tweet, response) {
                                                if(!error) {
                                                    console.log('Success')
                                                }
                                            }
                                        )
                                        
                            }
                        } else {
                            if(member.game === null) {
                                var eqtimevars = new Date()
                                var fullyear = eqtimevars.getFullYear()
                                var month = ('0' + (eqtimevars.getMonth() + 1)).slice(-2)
                                var date = ('0' + eqtimevars.getDate()).slice(-2)
                                var hours = ('0' + eqtimevars.getHours()).slice(-2)
                                var minutes = ('0' + eqtimevars.getMinutes()).slice(-2)
                                var seconds = ('0' + eqtimevars.getSeconds()).slice(-2)
                                var timedata = hours + '時' + minutes + '分' + seconds + '秒現在' // ex.)20180117174403
                                var cache = fs.readFileSync(dir + 'lib/key/' + member.id + '.key', 'utf-8')
                                var accountData = JSON.parse(cache)
                                var client = new twitter({
                                    consumer_key: consumerKey,
                                    consumer_secret: consumerSecret,
                                    access_token_key: accountData.key,
                                    access_token_secret: accountData.secret,
                                })
                                var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんが遊んでいるゲームはありません。（' + timedata + ')'
                                    client.post('statuses/update',
                                        {status: tweetContent},
                                            function(error, tweet, response) {
                                                if(!error) {
                                                    console.log('Success')
                                                }
                                            }
                                        )
                            } else {
                                var eqtimevars = new Date()
                                var fullyear = eqtimevars.getFullYear()
                                var month = ('0' + (eqtimevars.getMonth() + 1)).slice(-2)
                                var date = ('0' + eqtimevars.getDate()).slice(-2)
                                var hours = ('0' + eqtimevars.getHours()).slice(-2)
                                var minutes = ('0' + eqtimevars.getMinutes()).slice(-2)
                                var seconds = ('0' + eqtimevars.getSeconds()).slice(-2)
                                var timedata = hours + '時' + minutes + '分' + seconds + '秒現在' // ex.)20180117174403
                                var cache = fs.readFileSync(dir + 'lib/key/' + member.id + '.key', 'utf-8')
                                var accountData = JSON.parse(cache)
                                var client = new twitter({
                                    consumer_key: consumerKey,
                                    consumer_secret: consumerSecret,
                                    access_token_key: accountData.key,
                                    access_token_secret: accountData.secret,
                                })
                                var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんが遊んでいるゲームが「' + oldPresence.game.name + '」から「' + member.game.name + '」に変わりました。（' + timedata + ')'
                                    client.post('statuses/update',
                                        {status: tweetContent},
                                            function(error, tweet, response) {
                                                if(!error) {
                                                    console.log('Success')
                                                }
                                            }
                                        ) 
                            }
                        }
                    }
                }
            }
        setTimeout(function () {
        i = 0
        },1000) 
    }
})

            
bot.connect()