
/**
 * @brief   Данная функция создает виртуальное устройство для управления группой света.
 * 
 * @param {String}  title           Описание виртуального устройства (Можно на русском)
 * @param {String}  name            Имя виртуального устройства (Будет отображаться в новом виртуальном кстройстве как name/... )
 * @param {String}  targetButton    Одиночный топик или массив топиков, по изменению которых 
 *                                  будет происходить переключение света (Кнопки)
 * @param {String}  targetLight     Одиночный топик или массив топиков, которыми будет происходить управление (Реле)
 * @param {boolean} master          true - если это мастер выключатель. Перед отключением группы - запомнит 
 *                                  состояние реле и выключит, а при включении включит только те, которые были включены
 * @param {String}  targetMotion    Одиночный топик или массив топиков, по которым будет отслеживаться движение
 *                                  для включения или отключения группы света (Необязательный - если не указать, то 
 *                                  и не создадутся контролы для управления по движению).
 */
function createLightingGroup ( title , name , targetButton , targetLight , master , targetMotion ) {

    var firstStartRule = true;      // Флаг первого запуска модуля или перезагрузки правил

    if ( master ) {
        var ps = new PersistentStorage( name + "_storage", { global: true }); // Постоянное хранилище для запоминания состояний реле
    }


    // Создаем виртуальное устройство для управления группой реле
    defineVirtualDevice( name, {
        title: title,
        cells: {
            // Здесь только отображаем общее состояние группы.
            // Если хоть одно реле включено, то true ( смотри правило "_releChange" )
            stateGroup: {
                title: 'Состояние группы',
                type: "switch",
                value: false,
                readonly: true
            },
            // Виртуальная кнопка для управления группой реле
            button: {
                title: 'Вкл/Выкл группу',
                type: "pushbutton",
            },
            // Тут просто выводим общее кол-во реле в группе
            qty: {
                title: 'Кол-во групп света',
                type: "value",
                value: 0,
                readonly: true
            }
        }
    });


    

    // Перебираем массив источников света и создаем новые правила для управления реле
    targetLight.forEach( function (item, index, arr) {
        defineRule(name + ' ruleLight #' + index, {
            whenChanged: name + '/light_' + index,
            then: function (newValue, devName, cellName) {
                var s = getDevice(name).getControl( 'light_' + index ).getTitle();
                dev[s] = newValue;
            }
        });
    });


    /**
     * @brief   Правило обработки перезагрузки правил - по идее должно выполниться всего один раз в самом начале.
     *          Тут перебираем массив источников света "targetLight" и добавляем новые контролы этих источников в виртуальное устройство.
     *          Сразу при добавлении считываем текущее состояние реле. forceDefault обязателен.
     *          Так при обновлении правил новые виртуальные контролы перезагружаются с правильными состояния физических реле.
     */
    defineRule(name + '_rebootRule', {
        asSoonAs: function() {
            return firstStartRule;
        },
        then: function () {
            log.warning('[' + title + ']: Перезагрузка модуля'); 
            
            var flagON = false;

            targetLight.forEach( function (item, index, arr) {
                
                getDevice(name).addControl( "light_" + index , { 
                    title: item, 
                    type: "switch", 
                    value: dev[item], 
                    readonly: false,
                    forceDefault: true
                });
               
            });
            dev[name]['qty'] = targetLight.length;
            dev[name]['stateGroup'] = flagON;

            // Если указали датчики движения, то создаем нужные контролы
            if ( targetMotion ) {
                getDevice(name).addControl( "motion" , { 
                    title: "Присутствие в зоне", 
                    type: "switch", 
                    value: false, 
                    readonly: true
                });
                getDevice(name).addControl( "motionLightON" , { 
                    title: "Включать свет при начале движения", 
                    type: "switch", 
                    value: false, 
                    readonly: false
                });
                getDevice(name).addControl( "timeout" , { 
                    title: "Таймаут отключения света, мин.", 
                    type: "range", 
                    value: 10, 
                    readonly: false,
                    min: 1,
                    max: 20
                });
                getDevice(name).addControl( "sensitivity" , { 
                    title: "Чувствительность датчика", 
                    type: "range", 
                    value: 35, 
                    readonly: false,
                    min: 1,
                    max: 500
                });

                targetMotion.forEach( function(item, index, arr) {
                    getDevice(name).addControl( "motion_" + index , { 
                        title: item, 
                        type: "value", 
                        value: dev[item], 
                        readonly: true,
                        forceDefault: true
                    });
                });
            }
        }
    });


    /**
     * @brief   Правило отслеживает нажатие виртуальной кнопки "button".
     *          -   Включение или отключение основывается на виртуальном контроле
     *              "stateGroup". Если группа включена, то все отключаем и наоборот.
     *          -   Если это мастер-выключатель, то перед отключением запоминает 
     *              состояние реле в энергонезависимую память.
     */
    // Отслеживаем переключение виртуального контрола "button"
    defineRule(name + '_clickButtonVirtual', {
        whenChanged: name + '/button',
        then: function () {   
            targetLight.forEach( function (item) {
                if ( master ) {
                    // Если это мастер-выключатель, то перед отключением запоминаем состояние
                    if ( dev[name]['stateGroup'] ) {
                        ps[item] = dev[item];
                        dev[item] = false;
                    } else {
                        dev[item] = ps[item];
                    }

                } else {
                    // Если просто выключатель, то инверируем реле согласно состоянию группы
                    dev[item] = !dev[name]['stateGroup'];
                }

            });         
        }
    });

    // Отслеживаем нажатие физической кнопки
    defineRule(name + '_clickButtonPhysical', {
        whenChanged: targetButton,
        then: function () {
            dev[name]['button'] = true;
        }
    });


    // Отслеживаем изменение переключений физических реле и записываем в контролы для визуализации
    defineRule(name + '_releChange', {
        whenChanged: targetLight,
        then: function () {
            var flagON = false;
            targetLight.forEach( function (item, index, arr) {
                // Тут визуально изменяем контрол для наглядности
                getDevice(name).getControl( 'light_' + index ).setValue( dev[item] );
                // Если хоть одна группа включена, то взводим флаг
                if ( dev[item] ) flagON = true;
            });
            dev[name]['stateGroup'] = flagON;

            if ( targetMotion ) {
                if (idTimer) clearTimeout(idTimer);
                if ( dev[name]['stateGroup'] ) {
                    idTimer = startTimer();
                }
            }
        }
    });

    // Отслеживаем изменение датчиков движения, если они есть
    if ( targetMotion ) {

        var idTimer = null;            // Таймер для отключения света
        var idTimoutMotion = null;     // Таймер для задержки отключения контрола "motion"


        // Создаем функцию, которая создает таймер для отключения света по таймауту "timeout"
        function startTimer() {
            return setTimeout(function () {
                if ( dev[name]['stateGroup'] ) {
                    dev[name]['button'] = true;
                    log.debug('[' + title + ']: Выключение по таймауту ' + dev[name]['timeout'] + ' мин. ');
                }
                idTimer = null;
                
            }, dev[name]['timeout'] * 1000 * 60 ); //
        }

        // Создаем функцию задержки для отключения контрола "motion" ( 10 секунд )
        function startTimeoutMotion() {
            return setTimeout(function () {
                dev[name]['motion'] = false;
                idTimoutMotion = null;
                log.debug('[' + title + ']: Движение прекратилось');
            }, 10 * 1000); // 
        }


        // Правило отслеживает изменение датчиков движения
        defineRule(name + '_motionChange', {
            whenChanged: targetMotion,
            then: function () {
                var move = false;
                
                targetMotion.forEach(function (item, index, arr) {
                    // Изменяем виртуальный контрол для наглядности
                    getDevice(name).getControl( 'motion_' + index ).setValue( dev[item] );

                    // Если хоть один датчик выдал значение больше уставки, то значит появилось движение
                    if ( dev[item] > dev[name]['sensitivity'] ) move = true;
                });

                if ( move ) {
                    dev[name]['motion'] = true;

                    // Очищаем и взводим по новой таймер на задержку отключения контрола "motion"
                    if ( idTimoutMotion ) clearTimeout( idTimoutMotion );
                    idTimoutMotion = startTimeoutMotion();

                    // Если таймер на отключения света взведен, то отключаем его при появлении движения
                    if ( idTimer ) clearTimeout( idTimer );
                }
            }
        });

        // Правило для отслеживания начала движения
        defineRule(name + '_motionON', {
            asSoonAs: function() {
                return dev[name]['motion'];
            },
            then: function () {
                // Если активно включение света при начале движения
                if ( dev[name]['motionLightON'] ) {
                    if ( !dev[name]['stateGroup'] ) {
                        dev[name]['button'] = true;
                    }
                }
            }
        });

        // Правило для отслеживания прекращения движения
        defineRule(name + '_motionOFF', {
            asSoonAs: function() {
                return !dev[name]['motion'];
            },
            then: function () {
                if (idTimer) clearTimeout(idTimer);
                idTimer = startTimer();
            }
        });
    }


}

exports.createLightingGroup  = function( title , name , targetButton , targetLight , master , targetMotion ) {
    createLightingGroup ( title , name , targetButton , targetLight , master , targetMotion );
} 