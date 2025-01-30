<h1 align="center">
  <br>
  <img style="float: center;" height="150" src="logo.png">
  <br>
  <b>Модули для правил wb-rules</b>
  <br>
</h1>

Мои модули для движка правил **wb-rules** компании Wiren Board.

**При написании кода использовал:**

- [Официальная документация с описанием движка wb-rules на GitHub](https://github.com/wirenboard/wb-rules/tree/master)
- [Репозиторий для файлов сообщества wb-community](https://github.com/wirenboard/wb-community/tree/main)
- [Примеры правил на официальной странице Wiren Board](https://wirenboard.com/wiki/Rule_Examples)

## Готовые модули

1. [Модуль для управления светом по кнопкам и датчикам движения](https://github.com/SmithLEDs/wb-buttonLight)

## Установка

1. Для установки надо файл модуля, расположенный в папке `wb-rules-modules` загрузить на котроллер в папку `/mnt/data/etc/wb-rules-modules`.
2. Далее создать правило через WEB интерфейс контроллера и скопировать туда текст из примера, расположенный в папке `wb-rules` готового модуля.
3. Отредактировать устройства из примера под свои (`device/control`).
3. Нажать кнопку Сохранить и проверять работу модуля.

Для удобства подключения к контроллеру можно использовать программу [WinSCP](https://winscp.net/eng/download.php). С помощью данной программы можно подключиться к контроллеру по протоколу SFTP и получить доступ к файловой системе, не прибегая к использованию консоли.

* `/mnt/data/etc/wb-rules-modules` - Расположение файлов модулей
* `/mnt/data/etc/wb-rules` - Расположение файлов правил (скриптов)



