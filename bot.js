require('dotenv').config();
var fetch = typeof window !== 'undefined' ? window.fetch : require('node-fetch');
const { Telegraf } = require('telegraf');
const session = require('telegraf/session');
const bot = new Telegraf(process.env.BOT_TOKEN);
const hostAPI = 'http://185.104.114.240/';
const phoneQiwi = '+79853317686';

bot.use(session());

async function getData(url) {
  let data;
  await fetch(url)
    .then((res) => res.text())
    .then((body) => {
      data = body;
    });
  return data;
}

const catalogMenu = Telegraf.Extra.markdown().markup((m) =>
  m.inlineKeyboard([
    [m.callbackButton('SPAR', 'catalog:spar')]
  ])
);

bot.on('callback_query', (ctx) => {
  let data = ctx.callbackQuery.data;
  console.log(data);
  if(data.indexOf('get') !== -1){
    getData(`http://185.104.114.240/?action=getUser&tg_id=${ctx.from.id}`).then((res) => {
    if (typeof JSON.parse(res) === 'object') {
      if (JSON.parse(res).role === 'admin') {
        let s = data.split(':')[1];
        switch(data.split(':').length){
         case 2:
            if(s === 'spar'){
            ctx.editMessageText('введите диапазон цен как примере n-n');
            ctx.session.action = `getData&mag=${s}`;
          }
          break;
        }
      }
    }
    });
  }
  if (data.indexOf('catalog') !== -1) {
    function ucFirst(str) {
      if (!str) return str;
      return str[0].toUpperCase() + str.slice(1);
    }
    let nameShop = data.split(':')[1];

    switch (data.split(':').length) {
      case 1:
        ctx.editMessageText('Каталог', catalogMenu);
        break;
      case 2:
        getData(`${hostAPI}?action=get${ucFirst(nameShop)}`).then((res) => {
          if(res !== ''){ 
          const info = JSON.parse(res);
          if (typeof info === 'object') {
  
            switch(nameShop){
            case 'spar':
              info.sort((current, next) => {
                if (current.category_index < next.category_index) {
                  return -1;
                }
               });
              const sparMenu = Telegraf.Extra.markdown().markup((m) => {
              let list = [];
              info.forEach((currentValue, index) => {
                list.push([]);
                list[index].push(
                  m.callbackButton(
                    `SPAR ${currentValue.category_info.from} - ${currentValue.category_info.to} бонусов | ${currentValue.category_info.price} ₽ | ${currentValue.count} шт`,
                    `catalog:spar:${currentValue.category_index}`
                  )
                );
              });
              list.push([]);
              list[list.length - 1].push(m.callbackButton('⬅️ Назад', 'catalog'));
              return m.inlineKeyboard(list);
            });

            let title;
            if (info.length === 0) {
              title = 'Товар пока отсутствует';
            } else {
              title = 'Выберите категорию';
            }
            ctx.editMessageText(title, sparMenu);
            break;
            case 'mac':
              
            break;
          }
          }
        }
        });
        break;
      case 3:
        getData(`${hostAPI}?action=get${ucFirst(nameShop)}&category_id=${data.split(':')[2]}`).then((res) => {
          if (typeof JSON.parse(res) === 'object') {
            let info = JSON.parse(res);
            let numCategory = data.split(':')[2];
            const QShopmenu = Telegraf.Extra.markdown().markup((m) => {
              let list = [];
              let length;
              info.count > 10 ? (length = 10) : (length = info.count);
              for (let index = 0; index < length; index++) {
                list.push([]);
                list[index].push(m.callbackButton(`${index + 1} шт`, `catalog:spar:${numCategory}:${index + 1}`));
              }
              list.push([]);
              list[list.length - 1].push(m.callbackButton('⬅ Назад', 'catalog:spar'));
              return m.inlineKeyboard(list);
            });

            ctx.editMessageText('Сколько штук вы купите?', QShopmenu);
          }
        });
        break;
      case 4:
        const buttons = Telegraf.Extra.markdown().markup((m) =>
          m.inlineKeyboard([
            [m.callbackButton('✅ Подтверждаю', `${data}:yes`)],
            [m.callbackButton('❌ Не подтверждаю', `catalog`)],
          ])
        );
        let text = `***Подтвердите покупку***
Подтверждая покупку вы также соглашаетесь с нашими правилами`;
        ctx.editMessageText(text, buttons);
        break;
      case 5:
        if (data.split(':')[4] === 'yes') {
          getData(
            `http://185.104.114.240/?action=buy&shop=${data.split(':')[1]}&cat=${data.split(':')[2]}&q=${
            data.split(':')[3]
            }&tg_id=${ctx.update.callback_query.from.id}`
          ).then((res) => {
            if (res !== '') {
              let dataParse = JSON.parse(res);
              if (typeof dataParse === 'object') {
                console.log(data.split(':'));
                let textTemplate = ``;
                switch (data.split(':')[1]) {
                  case 'spar':
                    for (let i = 0; i < dataParse.length; i++) {
                      let item = dataParse[i];
                      textTemplate += `
***Данные для входа***
 ${item.login} : ${item.pass}
 Количество бонусов: ${item.bonus_count}
 ${item.card_num}
            `;
                    }
                    break;
                }
                ctx.editMessageText(textTemplate);
              } else {
                let errorText = 'Не хватает средств';
                ctx.reply(errorText);
              }
            }
          });
        }
        break;
    }
  }

  if (data.indexOf('payment:check') === 0) {
    getData(`http://185.104.114.240/?action=checkCode&code=${data.split(':')[2]}`).then((res) => {
      if (res !== '') {
        let info = JSON.parse(res);
        if (info.status) {
          let text = `Баланс пополнен на ${info.sum} руб.`;
          ctx.editMessageText(text);
        }
      } else {
        ctx.reply('Баланс не пополнен');
      }
    });
  }
  if(data.indexOf('del') !== -1){
    switch(data.split(':').length){
      case 2:
        ctx.editMessageText('Введите del:id а чтобы удалить все введите del:all')
        ctx.session.action = `del&${data.split(':')[1]}`
      break;
    }
  }
});

const mainMenu = Telegraf.Extra.markdown().markup((m) =>
  m
    .keyboard([
      [m.callbackButton('🛒 Каталог'), m.callbackButton('💵 Пополнить баланс')],
      [m.callbackButton('👤 Профиль'), m.callbackButton('📖 Правила')],
      [m.callbackButton('Помощь')],
    ])
    .resize()
);

bot.start((ctx) => {
  ctx.reply('Главное меню', mainMenu);
});

bot.command('admin', (ctx) => {
  getData(`http://185.104.114.240/?action=getUser&tg_id=${ctx.message.from.id}`).then((res) => {
    if (typeof JSON.parse(res) === 'object') {
      if (JSON.parse(res).role === 'admin') {
        const adminMenu = Telegraf.Extra.markdown().markup((m) =>
          m.keyboard([
            [m.callbackButton('Добавить SPAR'), m.callbackButton('Написать всем в боте')],
            [m.callbackButton('Получить аккаунты'),m.callbackButton('Изменить баланс user')],
            [m.callbackButton('Отредактировать правила'),m.callbackButton('Удалить данные')],
            [m.callbackButton('Отмена действий в админке')]
          ]).resize()
        );
        ctx.reply('Админ меню', adminMenu);
      }
    }
  });
});
bot.hears('Удалить данные', (ctx) => {
  getData(`http://185.104.114.240/?action=getUser&tg_id=${ctx.message.from.id}`).then((res) => {
    if (typeof JSON.parse(res) === 'object') {
      if (JSON.parse(res).role === 'admin') {
        const list = Telegraf.Extra.markdown().markup((m) =>
        m.inlineKeyboard([
          [m.callbackButton('SPAR', 'del:spar')]
        ])
        )
        ctx.reply('Выберите товар',list);
      }
    }
  });
});
bot.hears('Получить аккаунты', (ctx) => {
  getData(`http://185.104.114.240/?action=getUser&tg_id=${ctx.message.from.id}`).then((res) => {
    if (typeof JSON.parse(res) === 'object') {
      if (JSON.parse(res).role === 'admin') {
  const list = Telegraf.Extra.markdown().markup((m) =>
  m.inlineKeyboard([
    [m.callbackButton('SPAR', 'get:spar')]
  ])
);
ctx.reply('Выберите товар',list)
      }
    }
  })
});
bot.hears('Отмена действий в админке', (ctx) => {
  ctx.session.action = undefined;
  ctx.reply('Главное меню', mainMenu);
});
bot.hears('🛒 Каталог', (ctx) => {
  ctx.reply('Каталог', catalogMenu);
});
bot.hears('Помощь', (ctx) => {
  ctx.reply(`
  По всем вопросам писать сюда
  @sammyLuck`);
});
bot.hears('📖 Правила', (ctx) => {
  let text = `Возврат денежных средств
  **Возврат денежных средств предусмотрен в случае:
  
  - Не совпадения баллов при покупке аккаунта. Например купили диапазон 100-199, а на балансе меньше 100 бонусов.
  - Наличие чека магазина. 
  - Возврат денежных средств осуществляется исключительно на лицевой счет бота.
  =========================

  Гарантия
   Списать можно не более 99.99р за чек
  Гарантия распространяется на случаи:
  - Не прошло более 1 часа. 
  - Имеется чек с магазина.

  =========================
  Правила обращения в поддержку
  - Не пишите: "Привет", "Как дела?" и т п
  - Не надо спамить каждые 5 минут
  Если ваш вопрос касается вашей покупки (невалид, замена):
  - Изложите суть проблемы
  - Перешлите сообщения с бота вашей покупки - Чек бота.
  - Скриншот баланса аккаунта, если не соответствует баланс`;
  ctx.reply(text);
});
bot.hears('Написать всем в боте', (ctx) => {
  getData(`http://185.104.114.240/?action=getUser&tg_id=${ctx.message.from.id}`).then((res) => {
    if (typeof JSON.parse(res) === 'object') {
      if (JSON.parse(res).role === 'admin') {
        ctx.session.action = 'messageAll';
        ctx.reply('Пишите текст');
      }
    }
  });
});
bot.hears('Изменить баланс user', (ctx) => {
  getData(`http://185.104.114.240/?action=getUser&tg_id=${ctx.message.from.id}`).then((res) => {
    if (typeof JSON.parse(res) === 'object') {
      if (JSON.parse(res).role === 'admin') {
  ctx.reply('Чтобы изменить баланса нужно написать tg_id:sum');
  ctx.session.action = 'editBalance';
      }
    }
  });
})
bot.hears('Добавить SPAR', (ctx) => {
  getData(`http://185.104.114.240/?action=getUser&tg_id=${ctx.message.from.id}`).then((res) => {
    if (typeof JSON.parse(res) === 'object') {
      if (JSON.parse(res).role === 'admin') {
        ctx.session.action = 'loadData';
        ctx.reply('Теперь кидайте данные');
      }
    }
  });
});
bot.hears('👤 Профиль', async (ctx) => {
  await getData(`http://185.104.114.240/?action=getUser&tg_id=${ctx.message.from.id}`).then((res) => {
    if (typeof JSON.parse(res) === 'object') {
      let infoText = `
<b>Баланс</b>: <i>${JSON.parse(res).balance} руб.</i>\n
<b>Ваш id</b>: <i>${ctx.message.from.id}</i>\n
<b>Ваше имя</b>: <i>${ctx.message.from.first_name}</i>
    `;
      ctx.replyWithHTML(infoText);
    }
  });
});
bot.hears('💵 Пополнить баланс', async (ctx) => {
  let comment;
  await getData(`http://185.104.114.240/?action=getCode&tg_id=${ctx.message.from.id}`).then((res) => {
    comment = res;
  });
  const paymentMenu = Telegraf.Extra.markdown().markup((m) =>
    m.inlineKeyboard([
      [m.callbackButton('Я пополнил баланс ', `payment:check:${comment}`)],
      [
        m.urlButton(
          'Пополнить баланс по ссылке',
          `https://qiwi.com/payment/form/99?amountFraction=00&extra%5B%27account%27%5D=${phoneQiwi}&extra%5B%27comment%27%5D=${comment}&blocked[0]=comment&blocked[1]=account`
        ),
      ],
    ])
  );
  let text = `
  *Пополнение баланса*
  Для того чтобы пополнить баланс нужно

  *1) Оплатить заказ*
  QIWI по номеру *${phoneQiwi}* и ввести этот комментарий *${comment}*, либо перейти по ссылке нажав на кнопку "Пополнить баланс по ссылке"

  *2) Нажмите кнопку "Я пополнил баланс"*
   это нужно делать после перевода денег
  `;
  ctx.replyWithHTML(text, paymentMenu);
});
bot.on('text', async (ctx) => {
  if(ctx.session.action !== undefined){
  if (ctx.session.action === 'loadData') {
    if (typeof JSON.parse(`[${ctx.message.text.substring(0, ctx.message.text.length - 1)}]`) === 'object') {
      let data = JSON.parse(`[${ctx.message.text.substring(0, ctx.message.text.length - 1)}]`);
      for (let i = 0; i < data.length; i++) {
        let url = encodeURI(
          `http://185.104.114.240/?action=loadData&type=text&card=${data[i].card_user}&pass=${data[i].pass}&login=${data[i].login}&bonus=${data[i].bonus_count}`
        );
        await getData(url);
      }
    } else {
      ctx.session.action = undefined;
    }
  }
  if (ctx.session.action === 'messageAll') {
    console.log(ctx.message.text.indexOf('/'));
      getData(`${hostAPI}?action=getTG_id`).then((res) => {
        if (typeof JSON.parse(res) === 'object') {
          let data = JSON.parse(res);
          for (let i = 0; i < data.length; i++) {
            ctx.telegram.sendMessage(data[i][0], ctx.message.text);
          }
        }
      });
    }
    if(ctx.session.action.indexOf('del') !== -1){
      let product = ctx.session.action.split('&')[1];
      let id = ctx.message.text.split(':')[1];
      if(id !== undefined){
         getData(`${hostAPI}?action=delete&id=${id}&product=${product}`).then(res => res !== '1' ? ctx.reply('Не получилось') : ctx.reply('Все прошло удачно'));
      }
    }
    if(ctx.session.action === 'editBalance'){
      let info = ctx.message.text.split(':');
      if(info.length === 2){
        getData(`${hostAPI}?action=editBalance&tg_id=${info[0]}&sum=${info[1]}`).then(res =>{
          res === '1' ? ctx.reply('Баланс изменен') : ctx.reply('Баланс не изменен')
        });
      }
    }
  if (ctx.session.action.indexOf('getData&mag') !== -1) {
     let nameShop = ctx.session.action.replace(`getData&mag=`,'');
     switch(nameShop){
       case 'spar':
        console.log(ctx.message.text.indexOf('-'));
         if(ctx.message.text.indexOf('-') !== -1){
          let range = ctx.message.text.split('-');

          await getData(`${hostAPI}?action=getDataAdmin&shop=${nameShop}&from=${range[0]}&to=${range[1]}`).then(res => {
            if(res !== '' && res !== undefined && typeof JSON.parse(res) === 'object'){
              let data = JSON.parse(res);
              let listText = '';
              let line = 0;
              ctx.reply('Данные о аккаунтах');
              for(let i = 0; i < data.length; i++){
                listText += `id:${data[i].id}, login:${data[i].login}, pass:${data[i].pass}, бонусов: ${data[i].bonus_count}\n`;
                line++;
                if(line > 30){
                  ctx.reply(listText);
                  line = 0;
                  listText = '';
                }
                }
                if(data.length < 30){
                  ctx.reply(listText);
                }
                 
              }
          })

         }
       break;
     }
  }
}
  ctx.session.action = undefined;
});
bot.startPolling();
