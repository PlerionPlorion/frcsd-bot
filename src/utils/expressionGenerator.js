function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomExpression(target) {
    const operations = [
        "+",
        "-",
        "*",
        "/",
    ];

    const functions = [
        "sqrt",
        "log",
        "sin",
        "cos",
    ];

    function randomOperation() {
        return operations[randomInt(0, operations.length - 1)];
    }

    function randomFunction() {
        return functions[randomInt(0, functions.length - 1)];
    }

    function buildExpression(target) {
        let current = randomInt(1, 100);
        let message = `${current}`;
        let jsExpression = `${current}`;
        let steps = 0;
        const maxSteps = 25;

        while (current !== 1 && steps < maxSteps - 1) {
            let operation = randomOperation();
            const funct = randomFunction();

            const usingFunction = randomInt(1, 3) == 1;
            let operand = randomInt(2, 254);
            if (usingFunction) {
                const onSelf = randomInt(1, 3) == 1;
                if (onSelf) {
                    if ((funct == "sqrt" || (funct == "log" && current <= 1)) && current < 0) {
                        message = `${funct}(abs(${message}))`;
                        jsExpression = `Math.${funct}(Math.abs(${jsExpression}))`;
                    } else {
                        message = `${funct}(${message})`;
                        jsExpression = `Math.${funct}(${jsExpression})`;
                    }
                } else {
                    message = `${message}\\${operation}${funct}(${operand})`;
                    jsExpression = `${jsExpression}${operation}Math.${funct}(${operand})`;
                }
            } else {
                message = `${message}\\${operation}(${operand})`;
                jsExpression = `${jsExpression}${operation}(${operand})`;
            }
            current = eval(jsExpression);
            steps++;
        }

        if (current !== target) {
            // check if current's decimal will round up or down
            if (Math.round(current) > current) {
                const extra = Math.floor(target - current);
                message = `${message}+(${extra})`;
                current += extra;
            } else {
                const extra = Math.ceil(target - current);
                message = `${message}+(${extra})`;
                current += extra;
            }
        }
        
        return message;
    }

    return buildExpression(target);
}

module.exports = { generateRandomExpression, randomInt };