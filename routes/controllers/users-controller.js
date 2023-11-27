exports.getHome = async (req, res) => {
    try {
        res.status(200).send({message: 'Home Page Users'})
    } catch (err) {
        res.status(500).send({ message: "internal server error" })
    }
}