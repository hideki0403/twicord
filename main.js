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
        fs.statSync(dir + 'lib/cache/cache-' + name + '.cache')
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
                                fs.writeFileSync(dir + 'lib/cache/cache-' + msg.id + '.cache', tweet.id_str)
                                bot.createMessage(msg.channel.id, {
                                    embed: {
                                        color: 0x44fc53,
                                        author: {
                                            name: '[' + tweet.user.name + '] ツイートをしました!',
                                            icon_url: 'https://png.icons8.com/color/50/000000/ok.png'
                                        },
                                        description: tweetContent,
                                        footer: {
                                            text: '@' + tweet.screen_name,
                                            icon_url: tweet.user.profile_image_url
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
                                        description: 'ErrorCode:' + error
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
                                    color: 0x44fc53,
                                    author: {
                                        name: '[' + tweet.user.name + '] 画像付きツイートをしました!',
                                        icon_url: 'https://png.icons8.com/color/50/000000/ok.png'
                                    },
                                    description: '[ツイート内容]\n' + tweetContent,
                                    footer: {
                                        text: '@' + tweet.screen_name,
                                        icon_url: tweet.user.profile_image_url
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
                                    description: 'ErrorCode:' + error
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
                                    name: 'Error',
                                    icon_url: msg.author.avatarURL
                                },
                                description: 'エラーが発生しました。ユーザーが存在していないか、アカウントが凍結されている可能性があります。'
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
                        }
                    })
                    await bot.createMessage(msg.channel.id, {
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
                }
                runPick()

        }
    }
})

/*

// リアクション付けてふぁぼ・RTしようと思ったけどDiscordAPIの仕様上、リアクションを付けたメッセージの内容やIDを取得できなかったので断念
// しっかりしてくれよDiscordさん...

bot.on('messageCreate', (msg) => {
    if(msg.author.id === bot.user.id) {
        if(msg.embeds[0].footer.text.match(/^([1-9]\d*|0)$/)) {
            if(msg.embeds[0].footer.text.length === 19) {
                bot.addMessageReaction(msg.channel.id, msg.id, '❤')
                bot.addMessageReaction(msg.channel.id, msg.id, '🔁')
            }
        }
    }
})


bot.on('messageReactionAdd', (msg, emoji, userid) => {
    if(emoji.name.match(/❤|🔁/)) {
        if(isExistCacheFile(msg.id) === true) {
            var tweetID = fs.readFileSync(dir + 'lib/cache/cache-' + msg.id + '.cache')
                if(isExistFile(userid) === true) {
                    if(emoji.name === '❤') {
                        var cache = fs.readFileSync(dir + 'lib/key/' + msg.author.id + '.key', 'utf-8')
                        var accountData = JSON.parse(cache)
                        var client = new twitter({
                            consumer_key: consumerKey,
                            consumer_secret: consumerSecret,
                            access_token_key: accountData.key,
                            access_token_secret: accountData.secret,
                        })
                        client.post('statuses/retweet', {id: tweetID}, function(error, tweet, response) {
                            if (!error) {
                            }
                        })
                    } else {
                        if(emoji.name === '🔁') {
                            console.log('RT')
                        }
                    }
                        
                    
                
            }
        }   
    } 
})
*/
/*
i = 0

bot.on('presenceUpdate', (member, oldPresence) => {
    if(member.id === '242183143564640258') {
        // 状態変化で自動ツイートしようと思ったけど放り投げた
        i++
        if(i === 1) {
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
                var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんのステータスが' + memStatus + 'になりました。'
                    client.post('statuses/update',
                        {status: tweetContent},
                            function(error, tweet, response) {
                                if(!error) {
                                    console.log('Success')
                                }
                            }
                        )
            } else {

                    var cache = fs.readFileSync(dir + 'lib/key/' + member.id + '.key', 'utf-8')
                    var accountData = JSON.parse(cache)
                    var client = new twitter({
                        consumer_key: consumerKey,
                        consumer_secret: consumerSecret,
                        access_token_key: accountData.key,
                        access_token_secret: accountData.secret,
                    })
                    var tweetContent = '[Twicord自動ツイート]\n' + member.username + 'さんのプレイ中のゲームが「' + memStatus + '」になりました。'
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
            
            setTimeout(function () {
                i = 0
            },1000)
        }
    }
})
*/

bot.connect()